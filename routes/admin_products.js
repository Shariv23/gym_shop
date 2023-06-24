express = require('express');
var router = express.Router();
const { mkdirp } = require('mkdirp')
var fs = require('fs-extra');
var resizeImg = require('resize-img');

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.render('admin_products', {
            title: 'Admin Products'
        });
    });

};

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
//get edit product
router.get('/edit-product/:id', function (req, res) {

    var errors;

    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {

        Product.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('/admin/products');
            } else {
                var galleryDir = 'public/product_images/' + p._id + '/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_product', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price).toFixed(2),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });

    });

});


//exports
module.exports = router;

router.post('/edit-product/:id', function (req, res) {

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
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product/' + id);
    } else {
        Product.findOne({ slug: slug, _id: { '$ne': id } }, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'Product title exists, choose another.');
                res.redirect('/admin/products/edit-product/' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }

                    p.save(function (err) {
                        if (err)
                            console.log(err);

                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/product_images/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });

                        }

                        req.flash('success', 'Product edited!');
                        res.redirect('/admin/products/edit-product/' + id);
                    });

                });
            }
        });
    }

});

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

// POST product gallery

router.post('/product-gallery/:id', function (req, res) {

    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), { width: 100, height: 100 }).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);

});
// GET delete image

router.get('/delete-image/:image', function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    });
});

//GET delete product

router.get('/delete-product/:id', function (req, res) {

    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, function (err) {
                console.log(err);
            });

            req.flash('success', 'Product deleted!');
            res.redirect('/admin/products');
        }
    });

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

