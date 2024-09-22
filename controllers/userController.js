const path = require('path');
const User = require('../models/user');
const Card = require('../models/card');
const Icon = require('../models/icon');
const cardModel = new Card();
const userModel = new User();
const iconModel = new Icon();

// Home page controller
exports.getMainPage = (req, res) => {
    res.render(path.join(__dirname, '..', 'views', 'main.html'));
};

exports.getAllCardsPage = (req, res) => {
    res.render(path.join(__dirname, '..', 'views', 'all_cards.html'));
};

exports.getRulesPage = (req, res) => {
    res.render(path.join(__dirname, '..', 'views', 'rules.html'));
};

// Logout controller
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({error: 'Failed to logout'});
        }
        res.redirect('/login');
    });
};

// User Information Retrieval Controller
exports.getUserInfo = async (req, res) => {
    const user = new User();
    user.find(req.session.userId)
        .then(async () => {
            const icon = new Icon();
            const iconData = await icon.find(user.icon_id);
            res.json({full_name: user.full_name, login: user.login, icon_file_name: iconData.file_name});
        })
        .catch(err => {
            res.status(500).json({error: err.message});
        });
}

exports.getAllCardsInfo = async (req, res) => {
    try {
        const cards = await cardModel.findAllExcluding(['id']);

        res.json(cards);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.changeUserIcon = async (req, res) => {
    try {
        const user = new User();

        user.find(req.session.userId)
            .then(async (userData) => {
                let currentIconId = userData.icon_id;
                let newIconId = currentIconId + 1;

                const iconIds = await iconModel.getColumnValues('id');
                if (!iconIds.includes(newIconId)) {
                    newIconId = 1;
                }

                await user.updateField(req.session.userId, 'icon_id', newIconId);
                const icon = new Icon();
                const iconData = await icon.find(newIconId);

                res.json({icon_file_name: iconData.file_name});
            })
            .catch(err => {
                res.status(500).json({error: err.message});
            });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
}
