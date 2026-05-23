import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Venue, Court, Tournament } from '../models';
import { SportType, TournamentFormat, TournamentStatus, UserRole, UserStatus, AuthProvider } from '@shuttle-sync/shared';
import { tournamentService } from '../services/tournament.service';
import { logger } from '../utils/logger';
import { connectDB, disconnectDB } from '../config/database';

dotenv.config();

async function seedTournaments() {
    try {
        await connectDB();

        // 1. Lấy dữ liệu mẫu
        let organizer = await User.findOne({ email: 'host@shuttlesync.vn' });
        if (!organizer) organizer = await User.findOne({ role: UserRole.ADMIN });
        if (!organizer) organizer = await User.findOne();

        if (!organizer) {
            logger.error('No users found. Run main seed first.');
            process.exit(1);
        }

        const venues = await Venue.find().limit(1);
        if (venues.length === 0) {
            logger.error('No venues found.');
            process.exit(1);
        }
        const venue = venues[0];

        let allUsers = await User.find({ _id: { $ne: organizer._id } }).limit(64);
        
        if (allUsers.length < 64) {
            logger.info(`Chỉ có ${allUsers.length} user, đang tạo thêm ${64 - allUsers.length} mock users...`);
            const mockUsers = [];
            for (let i = allUsers.length; i < 64; i++) {
                mockUsers.push({
                    email: `player${i}@shuttlesync.vn`,
                    password: 'Password@123',
                    displayName: `Tay Vợt ${i}`,
                    role: UserRole.USER,
                    status: UserStatus.ACTIVE,
                    authProvider: AuthProvider.LOCAL,
                    sportPreferences: [SportType.BADMINTON]
                });
            }
            const insertedUsers = await User.insertMany(mockUsers);
            allUsers = [...allUsers, ...insertedUsers];
        }

        // 2. Clear old tournaments
        await Tournament.deleteMany({});
        logger.info('🗑️ Xóa các giải đấu cũ...');

        // 3. Tạo các Teams
        const teams = [];
        const numTeams = 32; // Tăng lên 32 đội
        
        for (let i = 0; i < numTeams; i++) {
            const member1 = allUsers[i * 2] || allUsers[0];
            const member2 = allUsers[i * 2 + 1] || allUsers[1];
            
            teams.push({
                _id: new mongoose.Types.ObjectId(),
                name: `Team ${i + 1}`,
                members: [member1._id, member2._id],
                registeredAt: new Date(),
                hasPaid: true,
                seed: i + 1
            });
        }

        // 5. Tạo Giải Đấu
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2);
        
        const registrationDeadline = new Date();
        registrationDeadline.setDate(registrationDeadline.getDate() - 1);

        let tournament = await Tournament.create({
            title: 'Giải Vô Địch Cầu Lông Quốc Gia 2026',
            description: 'Giải đấu quy mô siêu khủng dành cho các lông thủ đẳng cấp, tranh tài nảy lửa để giành lấy ngôi vương.',
            organizerId: organizer._id,
            courtId: venue._id, // Venue ID
            sportType: SportType.BADMINTON,
            format: TournamentFormat.SINGLE_ELIMINATION,
            status: TournamentStatus.REGISTRATION_CLOSED,
            startDate,
            endDate,
            registrationDeadline,
            maxTeams: 32,
            currentTeams: 32,
            entryFee: 500000,
            prizes: [
                { position: 1, description: 'Cúp vô địch + 50.000.000 VNĐ', amount: 50000000 },
                { position: 2, description: 'Huy chương Bạc + 30.000.000 VNĐ', amount: 30000000 },
                { position: 3, description: 'Huy chương Đồng + 10.000.000 VNĐ', amount: 10000000 }
            ],
            rules: 'Đánh đôi nam/nữ, vòng loại đánh 1 set chạm 21, bán kết và chung kết đánh 3 set thắng 2 (21 điểm).',
            contactInfo: '0901234567 - Zalo: ' + organizer.displayName,
            bannerImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80',
            teams,
            matches: [] // Trống ban đầu
        });

        logger.info(`✅ Tạo thành công giải đấu: ${tournament.title}`);

        // Generate bracket using service
        logger.info(`🔄 Đang phân nhánh 32 đội...`);
        tournament = await tournamentService.generateBracket(tournament._id.toString());

        // Mô phỏng kết quả thi đấu cho 2 vòng đầu tiên để giao diện đẹp
        const simulateRound = async (tour: any, roundNumber: number) => {
            let updated = false;
            tour.matches.forEach((match: any) => {
                if (match.round === roundNumber && match.team1Id && match.team2Id && !match.winnerId) {
                    const isT1Win = Math.random() > 0.5;
                    match.score1 = isT1Win ? 21 : Math.floor(Math.random() * 8) + 12; // Điểm từ 12-19
                    match.score2 = isT1Win ? Math.floor(Math.random() * 8) + 12 : 21;
                    match.winnerId = isT1Win ? match.team1Id : match.team2Id;

                    // Push winner to next round
                    const currentMatchIndexInRound = (match.matchNumber - 1) % (tour.matches.length / Math.pow(2, match.round - 1));
                    const nextMatchOffset = Math.floor(currentMatchIndexInRound / 2);
                    
                    const firstMatchOfNextRound = tour.matches.find((m: any) => m.round === match.round + 1);
                    if (firstMatchOfNextRound) {
                        const nextRoundMatch = tour.matches.find((nm: any) => nm.round === match.round + 1 && nm.matchNumber === (firstMatchOfNextRound.matchNumber + nextMatchOffset));
                        if (nextRoundMatch) {
                            if (currentMatchIndexInRound % 2 === 0) {
                                nextRoundMatch.team1Id = match.winnerId;
                            } else {
                                nextRoundMatch.team2Id = match.winnerId;
                            }
                        }
                    }
                    updated = true;
                }
            });
            if (updated) {
                await tour.save();
            }
        };

        // Chạy kết quả giả lập vòng 1 và vòng 2
        await simulateRound(tournament, 1);
        await simulateRound(tournament, 2);

        logger.info(`✅ Đã tạo ${teams.length} đội thi đấu`);
        logger.info(`✅ Đã mô phỏng 2 vòng đấu đầu tiên!`);

    } catch (err) {
        logger.error('❌ Lỗi seed tournament: ', err);
    } finally {
        await disconnectDB();
        process.exit(0);
    }
}

seedTournaments();
