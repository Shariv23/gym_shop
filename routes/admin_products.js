express = require('express');
var router = express.Router();
const { mkdirp } = require('mkdirp')
var fs = require('fs-extra');
var resizeImg = require('resize-img');


//Get Product model
var Product = require('../models/product');

//Get Category model
var Category = require('../models/category');

//get products index

router.get('/', async function (req, res) {
    try {
        const count = await Product.countDocuments().exec();
        const products = await Product.find().exec();

        res.render('admin/products', {
            products: products,
            count: count
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
});




router.get('/add-product', async function (req, res) {
    try {
        var title = "";
        var desc = "";
        var price = "";
        var categories = await Category.find();

        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    } catch (err) {
        console.log(err);
    }
});
// post add product




router.post('/add-product', function (req, res) {

    var imageFile = req.files && req.files.image ? req.files.image.name : "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            });
        });
    } else {
        Product.findOne({ slug: slug })
            .then((product) => {
                if (product) {
                    req.flash('danger', 'Product title exists, choose another.');
                    Category.find()
                        .then((categories) => {
                            res.render('admin/add_product', {
                                title: title,
                                desc: desc,
                                categories: categories,
                                price: price
                            });
                        })
                        .catch((err) => {
                            console.error('Error finding categories:', err);
                            res.redirect('/admin/products');
                        });
                }

                else {

                    var price2 = parseFloat(price).toFixed(2);

                    var product = new Product({
                        title: title,
                        slug: slug,
                        desc: desc,
                        price: price2,
                        category: category,
                        image: imageFile
                    });

                    product.save(function (err) {
                        if (err)
                            return console.log(err);

                        mkdirp('public/product_images/' + product._id, function (err) {
                            return console.log(err);
                        });

                        mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                            return console.log(err);
                        });

                        mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                            return console.log(err);
                        });

                        if (imageFile != "") {
                            var productImage = req.files.image;
                            var path = 'public/product_images/' + product._id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });
                        }

                        req.flash('success', 'Product added!');
                        res.redirect('/admin/products');
                    });
                }
            });
    }

});



router.get('/', async function (req, res) {
    const pages = await Page.find({}).sort({ sorting: 1 }).exec();

    // Find the index of the "Home" page in the array
    const homePageIndex = pages.findIndex(page => page.slug === 'home');

    // If "Home" page is found, assign it a lower sort value
    if (homePageIndex !== -1) {
        pages[homePageIndex].sorting = 0;
        await pages[homePageIndex].save();
    }

    // Sort the pages again based on the updated sorting values
    const sortedPages = await Page.find({}).sort({ sorting: 1 }).exec();

    res.render('admin/pages', {
        pages: sortedPages,
    });
});

//post reorder pages

var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
router.post('/reorder-pages', async function (req, res) {
    var ids = req.body['id[]'];
    var count = 0;

    if (ids && Array.isArray(ids)) {
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            count++;



            (function (count) {
                Page.findOne({ _id: id }).exec()
                    .then((page) => {
                        if (!page) {
                            return console.log('Page not found');
                        }
                        console.log('Page retrieved:', page);
                        page.sorting = count;
                        return page.save();
                    })
                    .then(() => {
                        console.log('Page saved successfully');
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            })(count);
        }

        // Retrieve the updated pages after reordering
        const updatedPages = await Page.find({}).sort({ sorting: 1 }).exec();
        console.log('Updated pages:', updatedPages);

        res.redirect('/admin/pages');
    }
});
//get edit page
router.get('/edit-page/:id', async function (req, res) {
    try {
        const page = await Page.findById(req.params.id).exec();

        res.render('admin/edit_page', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id,
        });
    } catch (err) {
        console.log(err);
    }
});
//exports
module.exports = router;

// //POST edit page
// router.post(
//     '/edit-page/:id',
//     [
//         body('title').notEmpty().withMessage('Title must have a value.'),
//         body('content').notEmpty().withMessage('Content must have a value.'),
//     ],
//     async (req, res) => {
//         try {
//             const title = req.body.title;
//             const slug = req.body.slug?.replace(/\s+/g, '-').toLowerCase() || title.replace(/\s+/g, '-');
//             const content = req.body.content;
//             const id = req.params.id;

//             const errors = validationResult(req);
//             if (!errors.isEmpty()) {
//                 res.render('admin/edit_page', {
//                     errors: errors.array(),
//                     title: title,
//                     slug: slug,
//                     content: content,
//                     id: id,
//                 });
//             } else {
//                 const page = await Page.findOne({ slug: slug, _id: { $ne: id } }).exec();

//                 if (page) {
//                     req.flash('danger', 'Page slug exists, choose another.');
//                     return res.render('admin/edit_page', {
//                         title: 'Danger',
//                         slug: slug,
//                         content: content,
//                         id: id,
//                     });
//                 }

//                 const updatedPage = await Page.findById(id).exec();

//                 if (!updatedPage) {
//                     // Handle page not found
//                     return res.redirect('/admin/pages');
//                 }

//                 updatedPage.title = title;
//                 updatedPage.slug = slug;
//                 updatedPage.content = content;
//                 await updatedPage.save();

//                 req.flash('success', 'Page updated!!!');
//                 res.redirect('/admin/pages/edit-page/' + updatedPage.id);
//             }
//         } catch (error) {
//             console.log(error);
//             res.redirect('/');
//         }
//     }
// );

//get delete index

router.get('/delete-page/:id', async function (req, res) {
    try {
        await Page.findByIdAndDelete(req.params.id);
        req.flash('success', 'Page deleted!!!');
        res.redirect('/admin/pages/');
    } catch (err) {
        console.log(err);
    }
});

// get add product
router.get('/add-product', async function (req, res) {
    try {
        var title = "";
        var desc = "";
        var price = "";
        var categories = await Category.find();

        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    } catch (err) {
        console.log(err);
    }
});




module.exports = router;

