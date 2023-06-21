var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('index', {
        title: 'Home'
    });
});

router.get('/test', function (req, res) {
    res.render('index', {
        title: 'omer'
    });
});
//exports
module.exports = router;