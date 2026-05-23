import { Types } from 'mongoose';
import { Tournament, ITournamentDocument } from '../models/Tournament';
import { TournamentStatus, SportType, TournamentFormat } from '@shuttle-sync/shared';

export class TournamentService {

    // 1. LẤY DATA GIẢI ĐẤU
    async getTournament(id: string) {
        const tour = await Tournament.findById(id).lean();
        if (!tour) throw new Error('Không tìm thấy giải đấu');
        return tour;
    }

    // 1.5. LẤY DANH SÁCH GIẢI ĐẤU CỦA TÔI
    async getMyTournaments(userId: string) {
        // Lấy các giải đấu mà user là organizer hoặc có tham gia
        const tours = await Tournament.find({
            $or: [
                { organizerId: userId },
                { 'teams.members': userId }
            ]
        }).sort({ createdAt: -1 }).lean();
        return tours;
    }

    // 2. TẠO NHANH GIẢI ĐẤU (QUICK CREATE) MẪU ĐỂ TEST
    async createQuickTournament(title: string) {
        // Tự động tạo 5 đội bóng
        const mockTeams = [
            { _id: new Types.ObjectId(), name: 'Nhóm Q.Bảo', members: [], hasPaid: true },
            { _id: new Types.ObjectId(), name: 'Team Flash', members: [], hasPaid: true },
            { _id: new Types.ObjectId(), name: 'Gà Con', members: [], hasPaid: true },
            { _id: new Types.ObjectId(), name: 'Sát Thủ', members: [], hasPaid: true },
            { _id: new Types.ObjectId(), name: 'Cầu Lông 8x', members: [], hasPaid: true }
        ];

        // Tạo giải đấu lưu vào Database
        const tour = await Tournament.create({
            title: title || 'Giải Cầu Lông Mở Rộng 2026',
            description: 'Giải đấu test hệ thống tự động chia nhánh.',
            organizerId: new Types.ObjectId(),
            courtId: new Types.ObjectId(),

            sportType: SportType.BADMINTON,
            format: TournamentFormat.SINGLE_ELIMINATION,

            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000),
            registrationDeadline: new Date(),
            maxTeams: 8,
            currentTeams: 5,
            contactInfo: '0909123456',
            teams: mockTeams
        });

        return await this.generateBracket(tour._id.toString());
    }

    // Hàm hỗ trợ: Tìm lũy thừa của 2 gần nhất (VD: 13 -> 16, 5 -> 8)
    private getNextPowerOf2(n: number) {
        let power = 1;
        while (power < n) { power *= 2; }
        return power;
    }

    // THUẬT TOÁN CHIA NHÁNH (BRACKET GENERATOR)
    async generateBracket(tournamentId: string) {
        // 1. Lấy thông tin giải đấu
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) throw new Error('Không tìm thấy giải đấu');
        if (tournament.teams.length < 2) throw new Error('Cần ít nhất 2 đội để bắt đầu giải đấu');

        // 2. Trộn ngẫu nhiên danh sách các đội (Bốc thăm)
        const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);

        const numTeams = shuffledTeams.length;
        const bracketSize = this.getNextPowerOf2(numTeams); // Số slot chuẩn (VD: 16)
        const byes = bracketSize - numTeams; // Số đội được đặc cách (VD: 3)

        const matches: any[] = [];
        const totalRounds = Math.log2(bracketSize);
        let matchNumberCounter = 1;

        // 3. Điền đội vào vòng 1 (Round 1)
        let teamIndex = 0;
        const round1MatchesCount = bracketSize / 2;

        for (let i = 1; i <= round1MatchesCount; i++) {
            let t1Id = null;
            let t2Id = null;
            let winnerId = null;

            // Bốc đội 1
            if (teamIndex < numTeams) {
                t1Id = shuffledTeams[teamIndex++]._id;
            }

            // Bốc đội 2 (Nếu còn byes thì nhường slot này trống)
            if (teamIndex < numTeams && (i > byes || i % 2 !== 0)) {
                t2Id = shuffledTeams[teamIndex++]._id;
            }

            // Nếu trận này có 1 đội và không có đối thủ -> Auto Win (Đặc cách)
            if (t1Id && !t2Id) {
                winnerId = t1Id;
            }

            matches.push({
                _id: new Types.ObjectId(),
                round: 1,
                matchNumber: matchNumberCounter++,
                team1Id: t1Id,
                team2Id: t2Id,
                winnerId: winnerId,
                score1: winnerId ? 21 : undefined, // Điểm giả định nếu Auto Win
                score2: winnerId ? 0 : undefined
            });
        }

        // 4. Tạo sẵn vỏ bọc rỗng cho các vòng tiếp theo (Round 2, 3...)
        for (let r = 2; r <= totalRounds; r++) {
            const matchesInRound = bracketSize / Math.pow(2, r);
            for (let m = 1; m <= matchesInRound; m++) {
                matches.push({
                    _id: new Types.ObjectId(),
                    round: r,
                    matchNumber: matchNumberCounter++,
                    team1Id: undefined,
                    team2Id: undefined,
                    winnerId: undefined
                });
            }
        }

        // 5. Cập nhật lại Database
        tournament.matches = matches;
        tournament.status = TournamentStatus.IN_PROGRESS; // Chuyển trạng thái sang "Đang diễn ra"

        // Đoạn này nâng cao: Tự động đẩy người "Đặc cách" lên vòng 2 luôn
        this.advanceAutoWinners(tournament);

        await tournament.save();
        return tournament;
    }

    // Hàm phụ: Lấy những đội Auto Win ở vòng trước đẩy lên vòng sau
    private advanceAutoWinners(tour: ITournamentDocument) {
        const matches = tour.matches;
        // Quét tất cả các trận
        matches.forEach(m => {
            if (m.winnerId) {
                // Xác định xem người thắng này sẽ chui vào trận nào ở vòng tiếp theo
                const currentMatchIndexInRound = (m.matchNumber - 1) % (matches.length / Math.pow(2, m.round - 1));
                const nextMatchOffset = Math.floor(currentMatchIndexInRound / 2);

                // Tìm trận đấu ở vòng tiếp theo
                const nextRoundMatch = matches.find(nm => nm.round === m.round + 1 && nm.matchNumber === (this.getStartMatchNumber(m.round + 1, matches) + nextMatchOffset));

                if (nextRoundMatch) {
                    // Nếu là người thắng từ nhánh chẵn thì vô team1, lẻ thì vô team2
                    if (currentMatchIndexInRound % 2 === 0) {
                        nextRoundMatch.team1Id = m.winnerId;
                    } else {
                        nextRoundMatch.team2Id = m.winnerId;
                    }
                }
            }
        });
    }

    // Tiện ích lấy ID trận bắt đầu của 1 vòng
    private getStartMatchNumber(round: number, matches: any[]) {
        const firstMatchOfRound = matches.find(m => m.round === round);
        return firstMatchOfRound ? firstMatchOfRound.matchNumber : 1;
    }

    // 6. CẬP NHẬT TRẬN ĐẤU (NHẬP ĐIỂM, ĐỔI ĐỘI BẰNG KÉO THẢ)
    async updateMatch(tournamentId: string, matchId: string, updateData: any) {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) throw new Error('Không tìm thấy giải đấu');

        const match = tournament.matches.find(m => m._id.toString() === matchId);
        if (!match) throw new Error('Không tìm thấy trận đấu');

        // Nếu kéo thả Đội vào trận này (Overwrite)
        if (updateData.slot !== undefined && updateData.teamId !== undefined) {
            if (updateData.slot === 1) {
                match.team1Id = updateData.teamId ? new Types.ObjectId(updateData.teamId) : undefined;
            } else if (updateData.slot === 2) {
                match.team2Id = updateData.teamId ? new Types.ObjectId(updateData.teamId) : undefined;
            }
        }

        // Cập nhật điểm số và người thắng
        if (updateData.score1 !== undefined) match.score1 = updateData.score1;
        if (updateData.score2 !== undefined) match.score2 = updateData.score2;
        if (updateData.winnerId !== undefined) {
            match.winnerId = updateData.winnerId ? new Types.ObjectId(updateData.winnerId) : undefined;
            
            // Tự động đẩy người thắng lên trận tiếp theo
            if (match.winnerId) {
                this.advanceAutoWinners(tournament);
            }
        }

        await tournament.save();
        return tournament;
    }
}

export const tournamentService = new TournamentService();