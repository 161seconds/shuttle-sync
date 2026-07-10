import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

import './src/models/User';
import './src/models/Venue.model';
import './src/models/Court';
import './src/models/Booking';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        const User = mongoose.model('User');
        const Venue = mongoose.model('Venue');
        const Court = mongoose.model('Court');
        const Booking = mongoose.model('Booking');

        const email = 'pickleballbaoanh@gmail.com';
        const owner = await User.findOne({ email });

        if (!owner) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        const venue = await Venue.findOne({ ownerId: owner._id });
        if (!venue) {
            console.error(`Venue for owner ${email} not found. Please create a venue first.`);
            process.exit(1);
        }

        const subCourts = await Court.find({ venueId: venue._id });
        if (subCourts.length === 0) {
            console.error(`No courts found for venue ${venue.name}. Please add some courts first.`);
            process.exit(1);
        }

        console.log(`Found Venue: ${venue.name} with ${subCourts.length} courts.`);

        // Setup Marvel Users for bookings
        const marvelEmails = ['tony@stark.com', 'peter@parker.com', 'steve@rogers.com', 'bruce@banner.com', 'natasha@romanoff.com', 'wanda@maximoff.com'];
        let marvelUsers = await User.find({ email: { $in: marvelEmails } });
        
        if (marvelUsers.length === 0) {
            console.log('Marvel users not found, creating them...');
            const newUsers = marvelEmails.map(email => ({
                email,
                displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + ' ' + email.split('@')[1].split('.')[0].toUpperCase(),
                password: 'password123',
                role: 'user',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            }));
            await User.insertMany(newUsers);
            marvelUsers = await User.find({ email: { $in: marvelEmails } });
        }

        // Generate 30 days of data
        const bookingsToInsert = [];
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const statuses = ['confirmed', 'completed', 'pending_payment', 'cancelled'];
        
        for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
            // Random number of bookings per day (between 3 and 15)
            const numBookings = Math.floor(Math.random() * 13) + 3;
            
            for (let i = 0; i < numBookings; i++) {
                const subCourt = subCourts[Math.floor(Math.random() * subCourts.length)];
                const randomUser = marvelUsers[Math.floor(Math.random() * marvelUsers.length)];
                
                // Random status (mostly confirmed/completed)
                const rand = Math.random();
                let status = 'confirmed';
                if (rand < 0.3) status = 'completed';
                else if (rand > 0.8 && rand <= 0.9) status = 'pending_payment';
                else if (rand > 0.9) status = 'cancelled';

                // Random time
                const startHour = Math.floor(Math.random() * 14) + 6; // 6h to 20h
                const startTime = `${startHour.toString().padStart(2, '0')}:00`;
                const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;

                const finalAmount = subCourt.pricePerHour || (Math.floor(Math.random() * 3) + 1) * 100000;
                
                const bookingDate = new Date(d);
                bookingDate.setHours(startHour, 0, 0, 0);

                bookingsToInsert.push({
                    bookingCode: 'MOCK_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    userId: randomUser._id, // Use Marvel user
                    courtId: venue._id,
                    subCourtId: subCourt._id,
                    date: bookingDate,
                    startTime,
                    endTime,
                    type: 'casual',
                    status,
                    totalAmount: finalAmount,
                    discount: 0,
                    finalAmount: finalAmount,
                    payment: {
                        method: 'cash',
                        status: status === 'completed' || status === 'confirmed' ? 'paid' : 'pending',
                        expiresAt: new Date(Date.now() + 86400000)
                    },
                    createdAt: bookingDate // Make it look like it was created on that day
                });
            }
        }

        console.log(`Inserting ${bookingsToInsert.length} mock bookings...`);
        
        // Remove existing mock bookings to avoid duplicates if run multiple times
        await Booking.deleteMany({ bookingCode: { $regex: /^MOCK_/ }, courtId: venue._id });
        
        await Booking.insertMany(bookingsToInsert);

        console.log('Successfully seeded mock data for the dashboard!');
        process.exit(0);

    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
