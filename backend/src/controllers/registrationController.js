const { validationResult } = require('express-validator');
const sequelize = require('../config/database');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendRegistrationEmail } = require('../services/emailService');

const register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { firstName, lastName, email, age, eventTitle } = req.body;
    const transaction = await sequelize.transaction();

    try {
        // 1. Find or create user
        const [user] = await User.findOrCreate({
            where: { email },
            defaults: { firstName, lastName, age },
            transaction
        });

        // 2. Find event
        let event = await Event.findOne({ where: { title: eventTitle }, transaction });

        // If event doesn't exist in DB yet (first time it's being registered for), create it
        // In a real app, events would already be in the DB.
        if (!event) {
            // Logic to fallback or create from some other source might be needed
            // For now, let's create a placeholder event if it's missing to make it work
            event = await Event.create({
                title: eventTitle,
                date: new Date(), // Placeholder
                location: 'To be announced',
                capacity: 100
            }, { transaction });
        }

        // 3. Check if already registered
        const existingRegistration = await Registration.findOne({
            where: { UserId: user.id, EventId: event.id },
            transaction
        });

        if (existingRegistration) {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'You are already registered for this event.'
            });
        }

        // 4. Check capacity
        if (event.registeredCount >= event.capacity) {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Event is at full capacity.'
            });
        }

        // 5. Create registration
        const registration = await Registration.create({
            UserId: user.id,
            EventId: event.id
        }, { transaction });

        // 6. Update event registeredCount
        await event.increment('registeredCount', { by: 1, transaction });

        await transaction.commit();

        // 7. Send confirmation email (async, don't block response)
        sendRegistrationEmail(user, event).catch(err => console.error('Email failed:', err));

        res.status(201).json({
            status: 'success',
            message: 'Successfully registered for ' + event.title,
            data: { registrationId: registration.id }
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

module.exports = { register };
