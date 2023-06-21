express = require('express');
var router = express.Router();

//Get page model
var Page = require('../models/page');

//get pages index

router.get('/', async function (req, res) {

    const pages = await Page.find({}).sort({ sorting: 1 }).exec();
    res.render('admin/pages', {
        pages: pages,
    });

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
// router.get('/', function (req, res) {
//     res.send('admin area');
// });

//get add page
router.get('/add-page', function (req, res) {
    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/add_page', {
        title: title,
        slug: slug,
        content: content
    });
});


router.post('/add-page', function (req, res) {

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('content', 'Content must have a value.').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/add_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        });
    } else {
        Page.findOne({ slug: slug }, function (err, page) {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.');
                res.render('admin/add_page', {
                    title: title,
                    slug: slug,
                    content: content
                });
            } else {
                var page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                });

                page.save(function (err) {
                    if (err)
                        return console.log(err);

                    Page.find({}).sort({ sorting: 1 }).exec(function (err, pages) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.pages = pages;
                        }
                    });

                    req.flash('success', 'Page added!');
                    res.redirect('/admin/pages');
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

//POST edit page
router.post('/edit-page/:id', function (req, res) {

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('content', 'Content must have a value.').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        });
    } else {
        Page.findOne({ slug: slug, _id: { '$ne': id } }, function (err, page) {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.');
                res.render('admin/edit_page', {
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                });
            } else {

                Page.findById(id, function (err, page) {
                    if (err)
                        return console.log(err);

                    page.title = title;
                    page.slug = slug;
                    page.content = content;

                    page.save(function (err) {
                        if (err)
                            return console.log(err);

                        Page.find({}).sort({ sorting: 1 }).exec(function (err, pages) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.pages = pages;
                            }
                        });


                        req.flash('success', 'Page edited!');
                        res.redirect('/admin/pages/edit-page/' + id);
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

module.exports = router;
