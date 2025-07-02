import User from '../models/Users.js';

export const getAllUsers = async (req, res) => {
    try {
        const doc = await User.findOne();
        if (!doc) {
            return res.status(404).json({ message: 'No users found' });
        }
        // Filter only users with role "user"
        const userOnly = doc.users.filter(u => u.role === 'user').map(user => {
            const { password, ...rest } = user.toObject();
            return rest;
        });;

        res.status(200).json({ users: userOnly });

    } catch (error) {
        res.status(500).json({ message: 'Failed to get users', error: error.message });
    }
};
