// Module dependencies.
var express = require('express')
    , http = require('http')
    , fs = require('fs')
    , path = require('path')
    , request = require('request')
    , async = require('async')
    , cons = require('consolidate')
    , dust = require('dustjs-linkedin')
    , md = require('github-flavored-markdown').parse
    , cheerio = require('cheerio')
    , mdfilter = require('./modules/mdfilter')
    , jsp = require("uglify-js").parser
    , pro = require("uglify-js").uglify;

var app = express();

// disable whitespace compression (nice for debug TODO: make deployment var dep)
//dust.optimizers.format = function(ctx, node) { return node };

// assign the dust engine to .dust files
app.engine('dust', cons.dust);

// basic auth
function authorize(username, password) {
    return 'py101' === username & 'py101' === password;
}

app.configure(function(){
    app.set('view engine', 'dust');
    app.set('views', __dirname + '/views');
    app.use(express.favicon(__dirname + '/public/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/public', {redirect: false}));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.basicAuth(authorize));
    app.use(app.router);
 });

// register .md as an engine in express view system
app.engine('md', function(path, options, fn){
    fs.readFile(path, 'utf8', function(err, str){
        if (err) return fn(err);
        try {
            var html = md(str);
            html = html.replace(/\{([^}]+)\}/g, function(_, name){
                return options[name] || '';
            })
            fn(null, html);
        } catch(err) {
            fn(err);
        }
    });
})

app.configure('development', function(){
    app.use(express.errorHandler());
});

// error handling
app.use(function(req, res, next){
    // respond with html page
    if (req.accepts('html')) {
        res.status(404);
        base.url = req.url
        res.render('404', base);
        return;
    }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

app.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.status(err.status || 500);
  base.error = err
  res.render('500', base);
});

// base context
var base = {
    author: {
      name: "Bruno Vieira",
      url: "http://bmpvieira.com"
    },
    year: 2012,
    site_title: 'Python 101: for biologists, by biologists',
    title: 'Python 101',
    meta: {
      description: 'Slides for the Python course of the CoBiG² team in 2012 at FCUL, Lisbon, Portugal',
      author: 'Python 101 Team'
    },
    google_analytics_id: 'ABCD',
    // markdown filter
    md: mdfilter.clientSide
};


// Get Creative Commons SVG in base
fs.readFile('public/img/cc.min.svg', 'utf8', function(err, str) {
    base.cc = str;
});

// Variables
var ptturl = 'https://dl.dropbox.com/s/l7ix60eiaw8caww/urls.txt?dl=1'
, pttpath = '../../../../run/media/bruno/Dropbox/Dropbox/documents/work/python101/urls.txt';

// Routes
var presentations = [];

// index that lists presentations
app.get('/old', function(req, res, next) {
    var url = 'https://dl.dropbox.com/s/l7ix60eiaw8caww/urls.txt?dl=1'
    , path = '../../../../run/media/bruno/Dropbox/Dropbox/Public/python101/urls.txt'
    , presentations = renderPresentationsUrls(function(url, path) {
        request(url, function(err, resp, body) {
            if (resp == undefined) {
                fs.readFile(path, 'utf8', function(err, str) {
                    if (err) next(err);
                    return str.split('\n');
                });
            } else if (resp.statusCode == 200) {
                return body.split('\n');
            } else {
                console.log('err: '+ resp.statusCode);
                console.log(body);
                next(err);
            };
        });
    base['presentations'] = presentations;
    res.render('index', base);
    });
});

// index that lists presentations
app.get('/', function(req, res, next) {
    presentations = [];
    request(ptturl, function(err, resp, body) {
        if (resp == undefined) {
            fs.readFile(pttpath, 'utf8', function(err, str) {
                if (err) next(err);
                renderPresentationsIndex(str.split('\n'));
                res.render('index', base);
            });
        } else if (resp.statusCode == 200) {
            renderPresentationsIndex(body.split('\n'));
            res.render('index', base);
        } else {
            console.log('err: '+ resp.statusCode);
            console.log(body);
            next(err);
        };
    });
});

function renderPresentationsIndex(lines) {
    for (line in lines) {
        var filename = lines[line].replace(/^.*[\\\/]/, '')
        , filename_noext = filename.replace(/(?:\.([^.]+))?$/, '\1')
        , filename_noext_websafe = filename_noext.replace(/[^a-z0-9_\-]/gi, '').toLowerCase()
        , presentation = {
            name: filename_noext_websafe,
            url: lines[line]
        };
        presentations.push(presentation);
    };
    base['presentations'] = presentations;
};

// presentations rendered client side
app.get('/client/:presentation', function(req, res, next) {
  for (i in presentations) {
    if (presentations[i]['name'] == req.params.presentation) {
      var url = presentations[i]['url']
    };
  };
  request(url, function(err, resp, body){
    base.slides = body;
    res.render('slides-client', base);
  });
});

//presentations rendered server side
/* app.get('/:presentationold', function(req, res, next) {
  for (i in presentations) {
    if (presentations[i]['name'] == req.params.presentation) {
      var url = presentations[i]['url']
    };
  };
  request(url, function(err, resp, body){
    var slides = mdfilter.serverSide(body);
    base['slides'] = slides;
    res.render('slides-server', base);
  });
}); */


// Concatenate tags async src files, used to read and embed scripts and css
function catTagFilesAsync(file, tag, callback) {
    fs.readFile(file, 'utf8', function(err, str) {
        if (err) next(err);
        $ = cheerio.load(str);
        var output = ""
        ,   len = $(tag).size()
        ,   counter = 0;
        $(tag).each(function(i, v) {
            var src = $(this).attr('src');
            if (src != undefined) {
                fs.readFile('public/' + src, 'utf8', function(err, body) {
                    if (err) {
                        request(src, function(err, resp, body) {
                            if(resp.statusCode == 200) {
                                console.log("ola");
                                
                                output += body;
                                console.log(output);
                                counter++;
                                if(counter == len) {callback(output);}
                            } else {
                                next(err);
                            }
                        });
                    } else {
                        //if(counter == 2) {console.log(body); console.log(src);};
                        output += body;
                        counter++;
                        if(counter == len) {callback(output);}
                    };
                });
            } else {
                counter++;
                if(counter == len) {callback(output);}
            }
        });
    });
};


// Concatenate tags src files, used to read and embed scripts and css
function catTagFilesSync(file, tag, callback) {
    try {
        var base = fs.readFileSync(file, 'utf8')
        $ = cheerio.load(base);
        var output = ""
        ,   len = $(tag).size()
        ,   counter = 0;
        $(tag).each(function(i, v) {
            var src = $(this).attr('src');
            if (src != undefined) {
                try {
                    body = fs.readFileSync('public/' + src, 'utf8');
                } catch(err) {
                    try {
                        request(src, res);
                    } catch(err) {
                        next(err);
                    }
                }
                output += body;
                counter++;
                if(counter == len) {callback(output);}
            }
            else{
                counter++;
                if(counter == len) {callback(output);}
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get list of tags src files with, used to read and embed scripts and css
function getTagSources(file, tag, attr, callback) {
    fs.readFile(file, 'utf8', function(err, str) {
        if (err) next(err);
        $ = cheerio.load(str);
        var output = []
        ,   len = $(tag).size()
        ,   counter = 0;
        $(tag).each(function(i, v) {
            var src = $(this).attr(attr);
            if(src != undefined) {
                output.push(src);
            }
            counter++
            if(counter == len) {callback(output)};
        });

    });
};

// Get item local or url for concat and code embeding
function getCatItem(item, callback) {
    if (item.match(/^http.*/)) {
         request(item, function(err, resp, body) {
            callback(null, body);
         });
    }
    else {
        fs.readFile("public/" + item, 'utf8', function(err, body) {
            callback(null, body);
        });
    }
};

// Embed js in base to allow single all-in-home html deployment
getTagSources('views/tmpl/base.dust', 'script', 'src', function(list) {
    async.concatSeries(list, getCatItem, function(err, scripts) {
        base.scripts = [];
        for (var i = 0; i < scripts.length; i++) {
            var ast = jsp.parse(scripts[i]); // parse code and get the initial AST
            ast = pro.ast_mangle(ast); // get a new AST with mangled names
            ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
            var script = pro.gen_code(ast, {inline_script: true}); // compressed code here
            base.scripts[i] = {script: script}
        }
    });
});

// Embed css in base to allow single all-in-home html deployment
getTagSources('views/tmpl/base.dust', 'link', 'href', function(list) {
    async.concatSeries(list, getCatItem, function(err, styles) {
        base.styles = [];
        for (var i = 0; i < styles.length; i++) {
            base.styles[i] = {style: styles[i]}
        }
    });
});

//presentations rendered server side
app.get('/:presentation', function(req, res, next) {
    for (i in presentations) {
        if (presentations[i]['name'] == req.params.presentation) {
            var url = presentations[i]['url']
        };
    };
    try {
        request(url, function(err, resp, body) {
            if (resp.statusCode == 200) {
                var slides = mdfilter.serverSide(body);
                $ = cheerio.load(slides);
                base.meta.author = $('#firstp').text(); 
                base.slides = slides;
                res.render('slides-server', base);
            } else {
                console.log('err: '+ resp.statusCode);
                console.log(body);
                next(err);
            }
        });
    } catch(err) {
        fs.readFile(url, 'utf8', function(err, str) {
            if (err) next(err);
            var slides = mdfilter.serverSide(str);
            $ = cheerio.load(slides);
            base.meta.author = $('#firstp').text(); 
            base.slides = slides;
            res.render('slides-server', base);
        });
    }
});

app.get('/404', function(req, res, next){
  next();
});

app.get('/403', function(req, res, next){
  var err = new Error('not allowed!');
  err.status = 403;
  next(err);
});

app.get('/500', function(req, res, next){
  next(new Error('Internal Server Error'));
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

//TODO: Check if error handling is done right or could be improved
//TODO: Check more elegant way to mix stuff in routes
//TODO: Clean up drafts and reorganize logic