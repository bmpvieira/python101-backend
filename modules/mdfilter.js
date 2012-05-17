var cheerio = require('cheerio')
    , dust = require('dustjs-linkedin')
    , md = require('github-flavored-markdown').parse;

// Client side render of markdown for dust.js and deck.js
// TODO: check if this is really client side
function clientSide(chunk, context, bodies) {
    var catdata = '';
    chunk.tap(function(data) {
        catdata += data;
        return '';
    }).render(bodies.block, context).untap();
    // Load html from rendered markdown
    $ = cheerio.load(md(catdata));
    // Add Deck.js markup by using h1 to split and for slides id
    // first p special formating for first slide
    $('p').first().attr('id', 'firstp')
    // change h2 to h3 before anything
    $('h2').each(function(i,v) {
        $(this).replaceWith('<h3>' + $(this).text() + '</h3>');
    });
    $('h1').each(function(i, v) {
        var slideid = $(this).text().replace(/[^a-z0-9]/gi, '_').toLowerCase() 
            + i;
        if(i === 0) {
            $(this).before('gtosection id="' 
                + slideid 
                + '" class="slide"lesserth');
        } else {
            // create slides
            $(this).before('gtcsectionlt \n gtosection id="' 
                + slideid 
                + '" class="slide"lesserth');
            // Change h1 to h2
            $(this).replaceWith('<h2>' + $(this).text() + '</h2>');
        }
    });
    // Add CodeMirror2 markup by replacing where lang=python with textarea
    $('pre[lang="python"]').each(function(i, v) {
        $(this).parent().after('<pre id="codeout' 
            + i 
            + '" class="codeout"></pre>');
        $(this).parent().replaceWith('<textarea id="code' + i + '" class="code">'
            + $(this).text()) 
            + '</textarea>';
    });
    // TODO: Find a way to avoid doing this regex by replacing directly with correct tags
    var output = $.html().replace(/gtosection/g,'<section').replace(/gtcsectionlt/g,'</section>').replace(/lesserth/g,'>')
        + '</section>';
    // BUG: Cheerio has some decoding bugs
    output = output.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return chunk.write(output);
};

// Server side render of markdown for dust.js and deck.js
function serverSide(mdbody) {
    // Load html from rendered markdown
    $ = cheerio.load(md(mdbody));
    // Add Deck.js markup by using h1 to split and for slides id
    // first p special formating for first slide
    $('p').first().attr('id', 'firstp')
    // change h2 to h3 before anything
    $('h2').each(function(i,v) {
        $(this).replaceWith('<h3>' + $(this).text() + '</h3>');
    });
    $('h1').each(function(i, v) {
        var slideid = $(this).text().replace(/[^a-z0-9]/gi, '_').toLowerCase() 
            + i;
        if(i === 0) {
            $(this).before('gtosection id="' 
                + slideid 
                + '" class="slide"lesserth');
        } else {
            // create slides
            $(this).before('gtcsectionlt \n gtosection id="' 
                + slideid 
                + '" class="slide"lesserth');
            // Change h1 to h2
            $(this).replaceWith('<h2>' + $(this).text() + '</h2>');
        }
    });
    // Add CodeMirror2 markup by replacing where lang=python with textarea
    $('pre[lang="python"]').each(function(i, v) {
        $(this).parent().after('<pre id="codeout' 
            + i 
            + '" class="codeout"></pre>');
        $(this).parent().replaceWith('<textarea id="code' + i + '" class="code">'
            + $(this).text()) 
            + '</textarea>';
    });
    // TODO: Find a way to avoid doing this regex by replacing directly with correct tags
    var output = $.html().replace(/gtosection/g,'<section').replace(/gtcsectionlt/g,'</section>').replace(/lesserth/g,'>')
        + '</section>';
    // BUG: Cheerio has some decoding bugs
    output = output.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return output;
};

// Exports
exports.clientSide = clientSide;
exports.serverSide = serverSide;