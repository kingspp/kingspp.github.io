jQuery(document).ready(function ($) {
    $('.page-content').css('background','#E5EAEE');

    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    var atTop = !$(document).scrollTop();
    var timelineBlocks;


    //on scolling, show/animate timeline blocks when enter the viewport
    $(window).on('scroll', function () {

        // if ($(document).scrollTop() == 0 && !atTop) {
        //     // do something
        //     $("#heading").remove();
        //     $("header").animate({
        //         height: 300
        //     }, {
        //         complete: function () {
        //             $("#rectangle").show()
        //         }
        //     });
        //     timelineBlocks = $('.cd-timeline-block'),
        //         offset = 0.8;
        //     hideBlocks(timelineBlocks, offset);
        //     atTop = true;
        // }
        // else if (atTop) {
        //     //$("header").empty();
        //     $("#rectangle").hide();
        //     $("header").animate({height: 100});
        //     if (!$('#heading').length)         // use this if you are using id to check
        //     {
        //         $("header").append("<h1 id='heading' style='margin-top:-100px'>Prathyush SP - The Journey</h1>");
        //     }
        //     atTop = false;
        // }


        (!window.requestAnimationFrame)
            ? setTimeout(function () {
                showBlocks(timelineBlocks, offset);
            }, 100)
            : window.requestAnimationFrame(function () {
                showBlocks(timelineBlocks, offset);
            });
    });

    function hideBlocks(blocks, offset) {
        blocks.each(function () {
            ( $(this).offset().top > $(window).scrollTop() + $(window).height() * offset ) && $(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
        });
    }

    function showBlocks(blocks, offset) {
        blocks.each(function () {
            ( $(this).offset().top <= $(window).scrollTop() + $(window).height() * offset && $(this).find('.cd-timeline-img').hasClass('is-hidden') ) && $(this).find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
        });
    }

    var html = "";
    $.getJSON("/assets/timeline.json", function (json) {
        $("#cd-timeline").empty();
        data = json['timeline'];
        data.sort(function (a, b) {return b.timestamp - a.timestamp;});
        $.each(data, function (k, v) {
            // var date = moment(v.date);
            html += '<div class="cd-timeline-block">' +
                '<div class="cd-timeline-img cd-movie"></div>' +
                '<div class="cd-timeline-content">' +
                ' <h2>' + v.header + '</h2>' +
                '<p>' + v.body + '</p>' +
                '<span class="cd-date">' + v.date + '<br/>'+v.place+'</span>' +
                '</div>' +
                '</div>';

        });

        $("#cd-timeline").append(html);
        //timelineBlocks = $('.cd-timeline-block'),
        //    offset = 0.8;
        timelineBlocks = $('.cd-timeline-block'),
            offset = 0.8;
        //hide timeline blocks which are outside the viewport
        hideBlocks(timelineBlocks, offset);
    });


});