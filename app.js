// Module dependencies.
var express = require('express')
    , http = require('http')
    , fs = require('fs')
    , path = require('path')
    , request = require('request')
    , cons = require('consolidate')
    , dust = require('dustjs-linkedin')
    , md = require('github-flavored-markdown').parse
    , mdfilter = require('./modules/mdfilter');

var app = express();

// disable whitespace compression (needed for markdown client-side filter)
dust.optimizers.format = function(ctx, node) { return node };

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
      author: 'Bruno Vieira'
    },
    google_analytics_id: 'ABCD',
    // markdown filter
    md: mdfilter.clientSide
};

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
            if(resp == undefined) {
                fs.readFile(path, 'utf8', function(err, str) {
                    if (err) next(err);
                    return str.split('\n');
                });
            } else {
                if(resp.statusCode == 200) {
                    return body.split('\n');
                } else {
                    console.log('err: '+ resp.statusCode);
                    console.log(body);
                    next(err);
                }
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
        if(resp == undefined) {
            fs.readFile(pttpath, 'utf8', function(err, str) {
                if (err) next(err);
                renderPresentationsIndex(str.split('\n'));
                res.render('index', base);
            });
        } else {
            if(resp.statusCode == 200) {
                renderPresentationsIndex(body.split('\n'));
                res.render('index', base);
            } else {
                console.log('err: '+ resp.statusCode);
                console.log(body);
                next(err);
            }
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
    base['slides'] = body;
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

//presentations rendered server side
app.get('/:presentation', function(req, res, next) {
    for (i in presentations) {
        if (presentations[i]['name'] == req.params.presentation) {
            var url = presentations[i]['url']
        };
    };
    try {
        request(url, function(err, resp, body) {
            if(resp.statusCode == 200) {
                var slides = mdfilter.serverSide(body);
                base['slides'] = slides;
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
            base['slides'] = slides;
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