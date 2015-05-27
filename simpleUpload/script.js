$(document).ready(function() {
    // load filename from url
    var urlFilename = getURLParameter('mapillary');
    if (urlFilename) {
        $('#mapillary').val(urlFilename);
        processFilename();  // lookup directly if filename
    }
    // responsive buttons
    $('.btn').hover(
        function() {
            if (!$(this).prop("disabled")) {
                $(this).addClass('active');
            }
        },
        function() {
            $(this).removeClass('active');
        }
    );
    // on enter or clicking button, look up info on Mapillary
    $('#mapillary').keypress(function(e) {
        if(e.which == 13) {
            processFilename();
        }
    });
    $('#button').click(function() {
        processFilename();
    });

});

// Validate filename and request info from Commons
function processFilename() {
    // reset later fields
    $('#reflect').empty();
    $('#button').prop('disabled', true);
    $('#thumbDiv').addClass('hidden');
    $('#mapillary').removeClass('highlighted');

    // test filename
    var run = true;
    var input = $('#mapillary').val();
    if (input === ''){
        $('#mapillary').addClass('highlighted');
        run = false;
    }
    else if ( input.match(/\/\/www.mapillary.com\/map\/im\//gi) ) {
        input = decodeURIComponent(input.split('/im/')[1]);
        $('#mapillary').val(input);
    }
    // run if mapillary_id is likely to be valid
    if (run) {
        queryMapillary(input);
        $('#button').prop('disabled', false);
    }
    else {
        $('#button').prop('disabled', false);
    }
}

// query mapillary and process response
function queryMapillary(file_key) {
    var url = 'https://a.mapillary.com/v2/g/' +
              file_key +
              "?client_id=NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzoxNjQ3MDY4ZTUxY2QzNGI2";

    $.ajax({
        url: url,
        dataType: 'json',
        success: function (data) {
            // console.log('raw mapillary data', data);
            var parseddata = data;
            if (parseddata.nodes.length === 0) {
                $('#reflect').text('Mapillary could not find any information on that id. Sure it is right?');
            }
            else {
                while (parseddata.nodes[0].location === '') {
                    parseddata.nodes[0].location = prompt("Please enter a short description of the location", "");
                }
                parseddata.nodes[0].key = parseddata.nodes[0].key.replace ( /_/g , "$US$" ) ;
                var isoDate = new Date(parseddata.nodes[0].captured_at).toISOString().replace(/T/g, ' ').replace(/.000Z/g, '');
                var uploadDescription = '{{subst:Mapillary' +
                    '|location=' + parseddata.nodes[0].location +
                    '|key=' + parseddata.nodes[0].key +
                    '|date=' + isoDate +
                    '|username=' + parseddata.nodes[0].username +
                    '|lat=' + parseddata.nodes[0].lat +
                    '|lon=' + parseddata.nodes[0].lon +
                    '|ca=' + parseddata.nodes[0].ca +
                    '}}';
                var destFile = parseddata.nodes[0].location +
                               ' - Mapillary (' +
                               parseddata.nodes[0].key +
                               ').jpg';
                //request larger size
                var imageurl = parseddata.nodes[0].image.replace('thumb-1024.jpg', 'thumb-2048.jpg');
                var magnusurl = '//tools.wmflabs.org/url2commons/index.html?' +
                                'run=1&' +
                                'urls=' + imageurl + ' ' +
                                destFile + '|' +
                                encodeURIComponent(uploadDescription) +
                                '&desc=$DESCRIPTOR$';
                // Ready to produce upload link
                $('#thumb').attr("src", imageurl);
                $('#submit_button').attr("href", magnusurl);
                $('#submit_button').html('<big>Upload as</big><br/>' + destFile);
                $('#thumbDiv').removeClass('hidden');
            }
        },
        error: function (jqxhr, textStatus, errorThrown) {
            $('#reflect').text('The ajax call failed: ' + textStatus + ' : ' + errorThrown);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });
}

// returns the named url parameter
function getURLParameter(param) {
    var pageURL = decodeURIComponent(window.location.search.substring(1));
    var urlVariables = pageURL.split('&');
    for (var i = 0; i < urlVariables.length; i++) {
        var parameterName = urlVariables[i].split('=');
        if (parameterName[0] == param) {
            return parameterName[1];
        }
    }
}
