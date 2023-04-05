const jwt = require('jsonwebtoken');

const randomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const getCurrentUserId = (req) => {
    const token = req.cookies.token;
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    return decodedToken.id;
}

module.exports = {
    randomId,
    getCurrentUserId
}