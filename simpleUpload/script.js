$(document).ready(function() {
    console.log('This is a quick hack. As such it might contain:\n' +
        '1. Swedish comments and text\n' +
        '2. unused code\n' +
        '3. crappy code\n' +
        '4. lack of error handling\n' +
        'If you care enough ping me at @Lokal_Profil and I\'ll stick it on github');
    // load filename from url
    var urlFilename = getURLParameter('mapillary');
    if (urlFilename) {
        $('#mapillary').val(urlFilename);
        processFilename();  // lookup direclty if filename
    }
    // responsive buttons
    $('.button').hover(
        function() {
            if (!$(this).prop("disabled")) {
                $(this).addClass('active');
            }
        },
        function() {
            $(this).removeClass('active');
        }
    );
    // add asterisk next to any required input field
    $('input').each(function() {
        if ($(this).prop('required')) {
            $(this).after("<span class=\"problem\">*</span>");
        }
    });
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
    $('#submit_button').addClass('hidden');
    $('#thumbDiv').addClass('hidden');

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
    queryMapillary(input);
    $('#button').prop('disabled', false);
}

// query mapillary and process response
function queryMapillary(file_key) {
    var url = 'https://a.mapillary.com/v2/g/' + file_key + "?client_id=NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzoxNjQ3MDY4ZTUxY2QzNGI2";

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
                var destFile = parseddata.nodes[0].location + ' - Mapillary (' + parseddata.nodes[0].key + ').jpg';
                var imageurl = parseddata.nodes[0].image.replace('thumb-1024.jpg', 'thumb-2048.jpg');  //request larger size
                var magnusurl = '//tools.wmflabs.org/url2commons/index.html?urls=' + imageurl + ' ' + destFile + '|' + encodeURIComponent(uploadDescription) + '&desc=$DESCRIPTOR$';
                // Ready to produce upload link
                $('#thumb').attr("src", imageurl);
                $('#thumbDiv').removeClass('hidden');
                $('#submit_button_link').attr("href", magnusurl);
                $('#submit_button').removeClass('hidden');
            }
        },
        error: function (jqxhr, textStatus, errorThrown) {
            alert("The ajax call failed");
            $('#reflect').text(textStatus + ' : ' + errorThrown);
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
