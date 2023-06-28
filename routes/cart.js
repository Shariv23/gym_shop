var express = require('express');
var router = express.Router();



// Get Product model
var Product = require('../models/product');



/*
 * GET add product to cart
 */
var cart;
var productCart = [];
var j = 0;
router.get('/add/:product', function (req, res) {

    var slug = req.params.product;

    Product.findOne({ slug: slug }, function (err, p) {
        if (err)
            console.log(err);

        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            });
        } else {
            cart = req.session.cart;

            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;

                    newItem = false;
                    break;
                }
            }

            if (newItem) {

                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }
        }
        j++;
        productCart.push(req.session.cart[j - 1].title);
        req.flash('success', 'Product added!');
        res.redirect('back');
    });

});


/*
 * GET checkout page
 */
router.get('/checkout', function (req, res) {

    if (req.session.cart && req.session.cart.length == 0) {
        //if cart is not empty
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        //if cart is empty
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });

    }
});

/*
 * GET update product
 */
router.get('/update/:product', function (req, res) {
    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    if (cart && Array.isArray(cart)) {  // Check if cart is defined and an array
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].title == slug) {
                switch (action) {
                    case "add":
                        cart[i].qty++;
                        break;
                    case "remove":
                        cart[i].qty--;

                        if (cart[i].qty == 0) {
                            cart.splice(i, 1);
                        }
                        break;

                    case "clear":
                        cart.splice(i, 1);
                        if (cart.length == 0) {
                            delete req.session.cart;
                        }
                        break;
                    default:
                        console.log('update problem');
                        break;
                }
                break;
            }
        }
    }

    req.flash('success', 'Cart Updated!');
    res.redirect('/cart/checkout');
});
/*
 * GET clear cart
 */
router.get('/clear', function (req, res) {

    delete req.session.cart;

    req.flash('success', 'Cleared!');
    res.redirect('/cart/checkout');
});

//GET buy now


router.get('/buynow', async function (req, res) {

    for (i = 0; i < productCart.length; i++) {

        await Product.updateMany({ title: productCart }
            , { $inc: { pursche: +1 } })

    }

    delete req.session.cart;

    res.sendStatus(200);

});







// Exports
module.exports = router;
