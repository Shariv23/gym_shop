express = require('express');
var router = express.Router();
const path = require('path');

/*
 * GET add managment
 */
var Product = require('../models/product');



router.get('/management', function (req, res) {
    Product.find({}, function (err, products) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        const filePath = path.resolve(__dirname, '..', 'views', 'admin', 'management.ejs');
        res.render(filePath, { products: products });
    });
});


module.exports = router;