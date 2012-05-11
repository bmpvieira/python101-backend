// Module dependencies.
var express = require('express')
    , http = require('http')
    , fs = require('fs')
    , path = require('path')
    , request = require('request')
    , cheerio = require('cheerio')
    , cons = require('consolidate')
    , dust = require('dustjs-linkedin')
    , md = require('github-flavored-markdown').parse;

var app = express();

// disable whitespace compression (needed for markdown filter)
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
    app.use(express.favicon());
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

// markdown helper function for dust.js
function mdfilter(chunk, context, bodies) {
  var catdata = '';
  chunk.tap(function(data) {
    catdata += data;
    return '';
  }).render(bodies.block, context).untap();
  // Load html from rendered markdown
  $ = cheerio.load(md(catdata));
  // Add Deck.js markup by using h1 to split and for slides id
  $('h1').each(function(i, v) {
    var slideid = $(this).html().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if(i === 0) {
      $(this).before('gtosection id="' + slideid + '" class="slide"lesserth');
    } else {
      $(this).before('gtcsectionlt \n gtosection id="' + slideid + '" class="slide"lesserth');
    }
    $(this).replaceWith('<h2>' + $('h1').html() + '</h2>');
  });
  // Add CodeMirror2 markup by replacing where lang=python with textarea
  $('pre[lang="python"]').each(function(i, v) {
    $(this).parent().after('<pre id="codeout' + i + '" class="codeout"></pre>');
    $(this).parent().replaceWith('<textarea id="code' + i + '" class="code">'
      + $(this).html()) 
      + '</textarea>';
  });
  // TODO: Find a way to avoid doing this regex by replacing directly with correct tags
  var output = $.html().replace(/gtosection/g,'<section').replace(/gtcsectionlt/g,'</section>').replace(/lesserth/g,'>')
    + '</section>';
  return chunk.write(output);
};

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
    md: mdfilter
  };

// routes

var presentations = [];
app.get('/', function(req, res, next) {
  var url = 'https://dl.dropbox.com/s/l7ix60eiaw8caww/urls.txt?dl=1';
  request(url, function(err, resp, body){
    var lines = body.split('\n');
    presentations = [];
    for (line in lines) {
      var filename = lines[line].replace(/^.*[\\\/]/, '');
      var filename_noext = filename.replace(/(?:\.([^.]+))?$/, '\1');
      var filename_noext_websafe = filename_noext.replace(/[^a-z0-9_\-]/gi, '').toLowerCase();
      var presentation = {
        name: filename_noext_websafe,
        url: lines[line]
      };
      presentations.push(presentation);
    };
    console.log(presentations);
    base['presentations'] = presentations;
    res.render('index', base);
  });
});

app.get('/:presentation', function(req, res, next) {
  for (i in presentations) {
    if (presentations[i]['name'] == req.params.presentation) {
      var url = presentations[i]['url']
    };
  };
  //console.log(req.params.presentation)
  //var url = function(req.params.presentation)
  //var url = presentations[req.params.presentation];
  request(url, function(err, resp, body){
    base['slides'] = body;
    res.render('slides', base);
  });
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