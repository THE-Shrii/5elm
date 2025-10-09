/**
/**
Core script to handle the entire theme and core functions
**/
var petperks = function(){
	/* Search Bar ============ */
	siteUrl = '';
	
	var screenWidth = $( window ).width();
	
	var homeSearch = function() {
		'use strict';
		/* top search in header on click function */
		var quikSearch = jQuery("#quik-search-btn");
		var quikSearchRemove = jQuery("#quik-search-remove");
		
		quikSearch.on('click',function() {
			jQuery('.dz-quik-search').fadeIn(500);
			jQuery('.dz-quik-search').addClass('On');
		});
		
		quikSearchRemove.on('click',function() {
			jQuery('.dz-quik-search').fadeOut(500);
			jQuery('.dz-quik-search').removeClass('On');
		});	
		/* top search in header on click function End*/
	}
	
	/* WOW ANIMATION ============ */
	var wow_animation = function(){
		if($('.wow').length > 0)
		{
			var wow = new WOW(
			{
			  boxClass:     'wow',      // animated element css class (default is wow)
			  animateClass: 'animated', // animation css class (default is animated)
			  offset:       50,          // distance to the element when triggering the animation (default is 0)
			  mobile:       false       // trigger animations on mobile devices (true is default)
			});
			
			setTimeout(function(){
				wow.init();
			}, 2100);
		}	
	}
	
	/* One Page Layout ============ */
	var onePageLayout = function() {
		'use strict';
		var headerHeight =   parseInt($('.onepage').css('height'), 10);
		
		$(".scroll").unbind().on('click',function(event) 
		{
			event.preventDefault();
			
			if (this.hash !== "") {
				var hash = this.hash;	
				var seactionPosition = $(hash).offset().top;
				var headerHeight =   parseInt($('.onepage').css('height'), 10);
				
				
				$('body').scrollspy({target: ".navbar", offset: headerHeight+2}); 
				
				var scrollTopPosition = seactionPosition - (headerHeight);
				
				$('html, body').animate({
					scrollTop: scrollTopPosition
				}, 800, function(){
					
				});
			}   
		});
		$('body').scrollspy({target: ".navbar", offset: headerHeight + 2});  
	}
	
	/* Header Height ============ */
	var handleResizeElement = function(){
		var headerTop = 0;
		var headerNav = 0;
		
		$('.header .sticky-header').removeClass('is-fixed');
		$('.header').removeAttr('style');
		
		if(jQuery('.header .top-bar').length > 0 &&  screenWidth > 991)
		{
			headerTop = parseInt($('.header .top-bar').outerHeight());
		}

		if(jQuery('.header').length > 0 )
		{
			headerNav = parseInt($('.header').height());
			headerNav =	(headerNav == 0)?parseInt($('.header .main-bar').outerHeight()):headerNav;
		}	
		
		var headerHeight = headerNav + headerTop;
		
		jQuery('.header').css('height', headerHeight);
	}
	
	var handleResizeElementOnResize = function(){
		var headerTop = 0;
		var headerNav = 0;
		
		$('.header .sticky-header').removeClass('is-fixed');
		$('.header').removeAttr('style');
		
		
		setTimeout(function(){
			
			if(jQuery('.header .top-bar').length > 0 &&  screenWidth > 991)
			{
				headerTop = parseInt($('.header .top-bar').outerHeight());
			}

			if(jQuery('.header').length > 0 )
			{
				headerNav = parseInt($('.header').height());
				headerNav =	(headerNav == 0)?parseInt($('.header .main-bar').outerHeight()):headerNav;
			}	
			
			var headerHeight = headerNav + headerTop;
			
			jQuery('.header').css('height', headerHeight);
		
		}, 500);
    }
	
	/* Load File ============ */
	var dzTheme = function(){
		'use strict';
		
		if(screenWidth <= 991 ){
			jQuery('.navbar-nav > li > a, .sub-menu > li > a').unbind().on('click', function(e){
				if(jQuery(this).parent().hasClass('open'))
				{
					jQuery(this).parent().removeClass('open');
				}
				else{
					jQuery(this).parent().parent().find('li').removeClass('open');
					jQuery(this).parent().addClass('open');
				}
			});
		}
		
		jQuery('.menu-btn, .openbtn').on('click',function(){
			jQuery('.contact-sidebar').toggleClass('active');
		});
		jQuery('.menu-close').on('click',function(){
			jQuery('.contact-sidebar').removeClass('active');
			jQuery('.menu-btn').removeClass('open');
		});
		
		jQuery('.dz-carticon').on('click',function(){
			jQuery(this).toggleClass('active');
		});
		jQuery('.dz-wishicon').on('click',function(){
			jQuery(this).toggleClass('active');
		});
	}
	//lightGallery
	var handleLightgallery = function() {
		if(jQuery('#lightgallery').length > 0){
			lightGallery(document.getElementById('lightgallery'), {
				plugins: [lgThumbnail, lgZoom],
				selector: '.lg-item',
				thumbnail:true,
				exThumbImage: 'data-src'
            });
		}
		if(jQuery('#lightgallery2').length > 0){
			lightGallery(document.getElementById('lightgallery2'), {
				plugins: [lgThumbnail, lgZoom],
				selector: '.lg-item',
				thumbnail:true,
				exThumbImage: 'data-src'
            });
		}
		if(jQuery('#lightgallery3').length > 0){
			lightGallery(document.getElementById('lightgallery3'),{
				plugins: [lgThumbnail, lgZoom],
				selector: '.lg-item',
				thumbnail:true,
				exThumbImage: 'data-src'
            });
		}
		if(jQuery('#lightgallery4').length > 0){
			lightGallery(document.getElementById('lightgallery4'),{
				plugins: [lgThumbnail, lgZoom],
				selector: '.lg-item',
				thumbnail:true,
				exThumbImage: 'data-src'
            });
		}
		if(jQuery('#lightgallery5').length > 0){
			lightGallery(document.getElementById('lightgallery5'),{
				plugins: [lgThumbnail, lgZoom],
				selector: '.lg-item',
				thumbnail:true,
				exThumbImage: 'data-src'
            });
		}
	}
	
	/* Magnific Popup ============ */
	var MagnificPopup = function(){
		'use strict';	
		
		if(jQuery('.mfp-gallery').length > 0)
		{
			/* magnificPopup function */
			jQuery('.mfp-gallery').magnificPopup({
				delegate: '.mfp-link',
				type: 'image',
				tLoading: 'Loading image #%curr%...',
				mainClass: 'mfp-img-mobile',
				gallery: {
					enabled: true,
					navigateByImgClick: true,
					preload: [0,1] // Will preload 0 - before current, and 1 after the current image
				},
				image: {
					tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
					titleSrc: function(item) {
						return item.el.attr('title') + '<small></small>';
					}
				}
			});
			/* magnificPopup function end */
		}
		
		if(jQuery('.mfp-video').length > 0)
		{
			/* magnificPopup for Play video function */		
			jQuery('.mfp-video').magnificPopup({
				type: 'iframe',
				iframe: {
					markup: '<div class="mfp-iframe-scaler">'+
							 '<div class="mfp-close"></div>'+
							 '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
							 '<div class="mfp-title">Some caption</div>'+
							 '</div>'
				},
				callbacks: {
					markupParse: function(template, values, item) {
						values.title = item.el.attr('title');
					}
				}
			});
			
		}

		if(jQuery('.popup-youtube, .popup-vimeo, .popup-gmaps').length > 0)
		{	
			/* magnificPopup for Play video function end */
			$('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
				disableOn: 700,
				type: 'iframe',
				mainClass: 'mfp-fade',
				removalDelay: 160,
				preloader: false,

				fixedContentPos: true
			});
		
		}
		
	}
	
	/* Scroll To Top ============ */
	var scrollTop = function (){
		'use strict';
		var scrollTop = jQuery("button.scroltop");
		/* page scroll top on click function */	
		scrollTop.on('click',function() {
			jQuery("html, body").animate({
				scrollTop: 0
			}, 1000);
			return false;
		})

		jQuery(window).bind("scroll", function() {
			var scroll = jQuery(window).scrollTop();
			if (scroll > 900) {
				jQuery("button.scroltop").fadeIn(1000);
			} else {
				jQuery("button.scroltop").fadeOut(1000);
			}
		});
		/* page scroll top on click function end*/
	}
	
	/* Header Fixed ============ */
	var headerFix = function(){
		'use strict';
		/* Main navigation fixed on top  when scroll down function custom */		
		jQuery(window).on('scroll', function () {
			if(jQuery('.sticky-header').length > 0){
				var menu = jQuery('.sticky-header');
				if ($(window).scrollTop() > menu.offset().top) {
					menu.addClass('is-fixed');
				} else {
					menu.removeClass('is-fixed');
				}
			}
		});
		/* Main navigation fixed on top  when scroll down function custom end*/
	}
	
	/* Masonry Box ============ */
	var masonryBox = function(){
		
		/* masonry by  = bootstrap-select.min.js */
		if(jQuery('#masonry, .masonry').length > 0){
			jQuery('.filters li').removeClass('active');
			jQuery('.filters li:first').addClass('active');
			var self = jQuery("#masonry, .masonry"); 
			var filterValue = "";
	 
			if(jQuery('.card-container').length > 0){
				var gutterEnable = self.data('gutter');
				
				var gutter = (self.data('gutter') === undefined)?0:self.data('gutter');
				gutter = parseInt(gutter);
				
				
				var columnWidthValue = (self.attr('data-column-width') === undefined)?'':self.attr('data-column-width');
				if(columnWidthValue != ''){columnWidthValue = parseInt(columnWidthValue);}
				
				self.imagesLoaded(function () {
					filter: filterValue,
					self.masonry({
						gutter: gutter,
						columnWidth:columnWidthValue, 
						//columnWidth:3, 
						//gutterWidth: 15,
						isAnimated: true,
						itemSelector: ".card-container",
						//gutterWidth: 15,
						//horizontalOrder: true,
						//fitWidth: true,
						//stagger: 30
						//containerStyle: null
						//percentPosition: true
					});
					
				}); 
			} 
		}
		
		if(jQuery('.filters').length>0){
			
			jQuery(".filters li:first").addClass('active');
			
			jQuery(".filters li").on('click', function() {
				
				jQuery('.filters li').removeClass('active');
				jQuery(this).addClass('active');
				
				var filterValue = $(this).attr("data-filter");
				
				self.isotope({ 
					filter: filterValue,
				});
			});
		}
		/* masonry by  = bootstrap-select.min.js end */
	}
	
	var handleIsotope = function(){
		
		/* masonry by  = bootstrap-select.min.js */
		if(jQuery('#Isotope, .isotope').length > 0){
			
			var self = jQuery('#Isotope, .isotope'); 
			
			self.isotope({
				itemSelector: '.card-container',
				layoutMode: 'fitRows',
			})
			
		}
		
		if(jQuery('.filter-isotope').length>0){
			
			jQuery(".filter-isotope li:first").addClass('active');
			
			jQuery(".filter-isotope li").on('click', function() {
				
				jQuery('.filter-isotope li').removeClass('active');
				jQuery(this).addClass('active');
				
				var filterValue = $(this).attr("data-filter");
				
				self.isotope({ 
					filter: filterValue,
				});
			});
		}
		
		/* masonry by  = bootstrap-select.min.js end */
	}
	
	/* Counter Number ============ */
	var counter = function(){
		if(jQuery('.counter').length)
		{
			jQuery('.counter').counterUp({
				delay: 10,
				time: 3000
			});	
		}
	}
	
	/* Video Popup ============ */
	var handleVideo = function(){
		/* Video responsive function */	
		jQuery('iframe[src*="youtube.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
		jQuery('iframe[src*="vimeo.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');	
		/* Video responsive function end */
	}
	
	/* Gallery Filter ============ */
	var handleFilterMasonary = function(){
		/* gallery filter activation = jquery.mixitup.min.js */ 
		if (jQuery('#image-gallery-mix').length) {
			jQuery('.gallery-filter').find('li').each(function () {
				$(this).addClass('filter');
			});
			jQuery('#image-gallery-mix').mixItUp();
		};
		if(jQuery('.gallery-filter.masonary').length){
			jQuery('.gallery-filter.masonary').on('click','span', function(){
				var selector = $(this).parent().attr('data-filter');
				jQuery('.gallery-filter.masonary span').parent().removeClass('active');
				jQuery(this).parent().addClass('active');
				jQuery('#image-gallery-isotope').isotope({ filter: selector });
				return false;
			});
		}
		/* gallery filter activation = jquery.mixitup.min.js */
	}
	
	/* Resizebanner ============ */
	var handleBannerResize = function(){
		$(".full-height").css("height", $(window).height());
	}
	
	/* BGEFFECT ============ */
	 var reposition = function (){
		'use strict';
		var modal = jQuery(this),
		dialog = modal.find('.modal-dialog');
		modal.css('display', 'block');
		
		/* Dividing by two centers the modal exactly, but dividing by three 
		 or four works better for larger screens.  */
		dialog.css("margin-top", Math.max(0, (jQuery(window).height() - dialog.height()) / 2));
	} 
	
	var handelResize = function (){
		/* Reposition when the window is resized */
		jQuery(window).on('resize', function() {
			jQuery('.modal:visible').each(reposition);
			
		});
	}
	
	
	/* Website Launch Date */ 
	var WebsiteLaunchDate = new Date();
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	WebsiteLaunchDate.setMonth(WebsiteLaunchDate.getMonth() + 1);
	WebsiteLaunchDate =  WebsiteLaunchDate.getDate() + " " + monthNames[WebsiteLaunchDate.getMonth()] + " " + WebsiteLaunchDate.getFullYear();
	/* Website Launch Date END */ 
	
	/* Countdown ============ */
	var handleCountDown = function(WebsiteLaunchDate){
		/* Time Countr Down Js */
		if($(".countdown").length)
		{
			$('.countdown').countdown({date: WebsiteLaunchDate+' 23:5'}, function() {
				$('.countdown').text('we are live');
			});
		}
		/* Time Countr Down Js End */
	}
		
	
	
	var boxHover = function(){
		jQuery('.box-hover').on('mouseenter',function(){
			var selector = jQuery(this).parent().parent();
			selector.find('.box-hover').removeClass('active');
			jQuery(this).addClass('active');
		});
	}
	
	var handleCurrentActive = function() {
		for (var nk = window.location,
			o = $("ul.navbar a").filter(function() {
				
				return this.href == nk;
				
			})
			.addClass("active")
			.parent()
			.addClass("active");;) 
		{
			
			if (!o.is("li")) break;
			
			o = o.parent()
				.addClass("show")
				.parent('li')
				.addClass("active");
		}
	}
	
	/* Mini Cart Function*/
	var handleShopCart = function(){
		$(".remove").on('click',function(){
			$(this).closest(".mini_cart_item").hide('500');
		});
		$('.cart-btn').unbind().on('click',function(){
			$(".cart-list").slideToggle('slow');
		})
		
	} 
	
	/* Range ============ */
	var priceslider = function(){
		if($("#slider-tooltips").length > 0 ) {
			var tooltipSlider = document.getElementById('slider-tooltips');
			
			var formatForSlider = {
				from: function (formattedValue) {
					return Number(formattedValue);
				},
				to: function(numericValue) {
					return Math.round(numericValue);
				}
			};

			noUiSlider.create(tooltipSlider, {
				start: [40, 346],
				connect: true,
				format: formatForSlider,
				tooltips: [wNumb({decimals: 1}), true],
				range: {
					'min': 0,
					'max': 400
				}
			});
			var formatValues = [
				document.getElementById('slider-margin-value-min'),
				document.getElementById('slider-margin-value-max')
			];
			tooltipSlider.noUiSlider.on('update', function (values, handle, unencoded) {
				formatValues[0].innerHTML = "Min Price: " + "$"+ values[0];
				formatValues[1].innerHTML = "Max Price: " + "$"+ values[1];
			});
		}
	}
	
	/* handle Bootstrap Touch Spin ============ */
	var handleBootstrapTouchSpin = function(){
	 	if($(".quantity-input").length > 0 ) {
			const numericInputs = document.querySelectorAll('.quantity-input');
			numericInputs.forEach(function(input) {
				input.addEventListener('input', function() {
					let currentValue = this.value;
					let newValue = currentValue.replace(/\D/g, '');
					this.value = newValue;
					if(this.value === ""){
						this.value = 0;
					}
				});
			});
			jQuery(".quantity-input").TouchSpin({
			  	verticalbuttons: true,
			  	min: 0,
			});
		}
	}
	
	var handleSmartWizard = function(){
		if(jQuery('#smartwizard').length > 0 ){
			$('#smartwizard').smartWizard(); 
		}
	}
	
	
	var handleSelectpicker = function(){
		if(jQuery('.default-select').length > 0 ){
			jQuery('.default-select').selectpicker();
		}
	}
	
	var dzCategoryToggle = function(){
		jQuery('.category-toggle .toggle-btn').on('click',function(){
			$(".toggle-items").slideToggle("slow");
			jQuery(this).toggleClass('active');
		});
		
		jQuery('.browse-category-menu .category-btn').on('click',function(){
			$(".category-menu-items").slideToggle("slow");
			jQuery(this).toggleClass('active');
		});
		
		/* accordion-button */
		
	}
	
	
	var heartBlast = function (){
		$(".heart").on("click", function() {
			$(this).toggleClass("heart-blast");
		});
	}
	
	/* Mini Cart Function*/
	var handleShopPannel = function(){

		function filterHandle(){
			if(screenWidth <= 1199 ){
				$(".panel-btn, .filter-top-btn").unbind().on('click',function(){
					$(".shop-filter,.panel-close-btn").addClass('active');
				});
			}
		}
		filterHandle();
		$(window).on('resize',function(){
			filterHandle();
		})

		$('.panel-close-btn').on('click',function(){
			$(".shop-filter,.panel-close-btn").removeClass('active');
		})
		if(screenWidth >= 1199 ){
			$("#filterTopBtn").click(function(){
				$("#shopFilter").slideToggle("slow");
			});
		}
		$(".btn-filter-left").on('click',function(){
			$(".shop-filter, .panel-close-btn").addClass('active');
		});
	}
	
	var cartButton = function(){
		$(".dz-close").on('click',function(){
			$(this).closest(".sidebar-cart-list li").fadeOut("normal", function() {
				$(this).remove();
			});
		});
		
		$(".tag-close").on('click',function(){
			$(this).closest(".filter-tag li").fadeOut("normal", function() {
				$(this).remove();
			});
		});
	} 
	
	/* Header Menu Item Function*/
	var handleHeaderMenuItem = function(){
		$(".menu-item").on('click',function(){
			$(".dzdrop-menu").toggleClass('show');
		});
		$(".menu-items").on('click',function(){
			$(this).toggleClass('active');
		});
	}
	
	var handleColorFilter = function(){
		var colorsInput = document.querySelectorAll(".color-filter .form-check-input");
		colorsInput.forEach(colorChange)
		function colorChange(item, index, arr) {
			var color = $(item).val();
			var element = $(item).closest('.form-check').find('span');
			element.css({backgroundColor : color});
		}
	}
	
	var handleMultipleImageSize = function(){
		
		jQuery('.smart-product-details .dz-media img').removeAttr('style');
		setTimeout(function(){
			//var ch = jQuery('.smart-product-details .dz-content').height();
			
			//jQuery('.smart-product-details .dz-media img').css('--static-height',ch+'px');	
			
			jQuery('.smart-product-details .dz-content').each(function(){
				var ch = Math.ceil(jQuery(this).outerHeight());
				jQuery(this).parent().find('.dz-media img').css('--static-height',ch+'px');	
			});
			//console.log(ch);
			
		}, 500);
		
		
	}


	var menuHover = function(){
		jQuery('.header-menu .nav > li').on('mouseenter',function(){
			jQuery('.header-menu .nav > li').removeClass('active');
			jQuery(this).addClass('active');
		})
		jQuery('.menu-nav-btn').on('click',function(){
			jQuery('.page-wraper').toggleClass('active-menu');
			//jQuery(this).addClass('active');
		})
	}
		
	
	var wishlistBtn = function(){
		jQuery('.wishlist-link').on('click',function(){
			jQuery('.product-description .nav-tabs button[data-bs-target="#wishlist-pane"]').tab('show');
		})
		jQuery('.cart-btn').on('click',function(){
			jQuery('.product-description .nav-tabs button[data-bs-target="#shopping-cart-pane"]').tab('show');
		})
	}
	
	/* Coming Soon Counter ============ */
	var handleComingSoonCounter = function(){
		
		var commingSoonDate = new Date(WebsiteLaunchDate).getTime();
		
		var x = setInterval(function() {
			clockCounter();
		}, 1000);
		
		function clockCounter(){
			var currentTime = new Date().getTime();
			var clockTime = commingSoonDate - currentTime;

			// Time calculations for days, hours, minutes and seconds
			var days = Math.floor(clockTime / (1000 * 60 * 60 * 24));
			var hours = Math.floor((clockTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			var minutes = Math.floor((clockTime % (1000 * 60 * 60)) / (1000 * 60));
			var seconds = Math.floor((clockTime % (1000 * 60)) / 1000);

			var remainDays 		= (days.toString().length 		== 1) ? '0'+days	: days;
			var remainHour 		= (hours.toString().length 		== 1) ? '0'+hours	: hours;
			var remainMin 		= (minutes.toString().length 	== 1) ? '0'+minutes	: minutes;
			var remainSeconds 	= (seconds.toString().length 	== 1) ? '0'+seconds	: seconds;

			jQuery('#day').text(remainDays);
			jQuery('#hour').text(remainHour);
			jQuery('#min').text(remainMin);
			jQuery('#second').text(remainSeconds);
			
			var rotateNum = 6 * seconds;

			$('.round').css({'transform': 'rotate(' + rotateNum + 'deg)'});
			$('.round').css({'-webkit-transform': 'rotate(' + rotateNum + 'deg)'});
			$('.round').css({'-o-transform': 'rotate(' + rotateNum + 'deg)'});
			$('.round').css({'-moz-transform': 'rotate(' + rotateNum + 'deg)'});
			$('.round').css({'-ms-transform': 'rotate(' + rotateNum + 'deg)'});

			// If the count down is over, write some text 
			if (clockTime < 0) {
				clearInterval(x);
				jQuery("#day, #hour, #min, #second").html("EXPIRED");
			}
		}
		
	}
	
	/* handleSupport */
	var handleSupport = function(){
		var support = '<script id="DZScript" src="https://dzassets.s3.amazonaws.com/w3-global-2.0.js?token=W-50402c78daa2c0db7814891abf78660b"></script>';
		jQuery('body').append(support);
	}
	
	var navScroller = function(){
		var previousScroll = 0;
		$(window).scroll(function(){
			if(screenWidth <= 768 ){
				if ($(this).scrollTop() + 
					$(this).innerHeight() >=  
					document.querySelector("body").scrollHeight) { 
					 $('.extra-nav').addClass('bottom-end');
				}else{
					 $('.extra-nav').removeClass('bottom-end');
				}
				var currentScroll = $(this).scrollTop();
				if (currentScroll > previousScroll){
					//scroll down
					$('.extra-nav').addClass('active');
				} else {
					//scroll up
					$('.extra-nav').removeClass('active');
				}
				previousScroll = currentScroll;
			}
			
		});
	}
	
	var handleMagnifyGallery = function(){
		if(jQuery('.DZoomImage').length > 0 ){
			const imageSelector = $('.DZoomImage');
		
			// let x = imageSelector.find('img');
			// $(window).on('resize',function(){
			// 	console.log(imageSelector.width(),imageSelector.height());
			// 	// x.css("width", imageSelector.width() + "px");
			// 	// x.css("height", imageSelector.height() + "px");
			// }) 

			// var myModalEl = document.getElementById('exampleModal')
			// myModalEl.addEventListener('show.bs.modal', function (event) {
			// 	x.css("width", "auto");
			// 	x.css("height", "auto");
			// })


			imageSelector.on('mousemove',function(t) {
				let e = $(this).offset();
				var i = (t.pageX - e.left) / $(this).width() * 100 <= 100 ? (t.pageX - e.left) / $(this).width() * 100 : 100;
				var c = (t.pageY - e.top) / $(this).height() * 100 <= 100 ? (t.pageY - e.top) / $(this).height() * 100 : 100;
				
				$(this).find('img').css("transform-origin", i + "% " + c + "%");
			})
			imageSelector.on('mouseenter',function(t) {
				let n = $(this).find('img');
				n.css("cursor", "pointer"), 
					/* n.css("width", $(this).width() + "px"), 
					n.css("height", $(this).height() + "px"), */ 
				n.css("transition", "0.1s"), 
				n.css("transform", "scale(" + 1.5 + ")"),
				$(this).find('.mfp-link i').css({opacity : 1,zIndex : 1})
			});
			imageSelector.on('mouseleave',function(t) {
				let n = $(this).find('img');
				n.css("transition", "0.1s"), n.css("transform", "scale(1)")
				$(this).find('.mfp-link i').css({opacity : 0,zIndex : 1})
			});
		}
		
		
	}
	
	/* heart-blast */
	var handleActiveBTN= function(){
		if(jQuery('.btn-active').length > 0 ){
			$('.btn-active').on('click', function () {
				$(this).toggleClass('active');
			});
		}	
	}	
	
	var handleShowPass = function () {
		jQuery('.show-pass').on('click', function () {
			var inputType = jQuery(this).parent().find('.dz-password');
			if (inputType.attr('type') == 'password') {
				inputType.attr('type', 'text');
				jQuery(this).addClass('active');
			}
			else {
				inputType.attr('type', 'password');
				jQuery(this).removeClass('active');
			}
		});
	}
	
	
	
	/* var contactform = function (){
		jQuery('.menu-btn').on('click', function () {
				jQuery('body').append('<div class="menu-backdrop"></div>');
				jQuery('.menu-backdrop').on('click', function (){
					jquery('.contact-sidebar').removeClass('active');
					
				});
		});
			
		jQuery('.menu-btn').on('click', function (){
			jquery('.contact-sidebar').addClass('active');
				
		});
	}; */
	
	// var handleOpenModal = function(){
		
	// 	var modalBox = `<div class="modal fade inquiry-modal style-1" id="myModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
	// 		<div class="modal-dialog" role="document">
	// 			<div class="inquiry-adv bg-main">
	// 				<img src="images/cs.png" alt=""/>
	// 			</div>
	// 			<div class="modal-content bg-light">
	// 				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
	// 				×</button>
	// 				<div>
	// 					<div class="modal-header">
	// 						<span class="title-head">Newsletter</span>
	// 						<h3 class="modal-title" id="exampleModalLongTitle">Subscribe Now</h3>
	// 						<p class="text">Stay updated on all that’s new add noteworthy</p>
	// 					</div>
	// 					<div class="modal-body">
	// 						<form action="script/mailchamp.php" class="dzSubscribe" method="post">
	// 							<div class="dzSubscribeMsg"></div>
	// 							<div class="form-group">
	// 								<label class="form-label">Email Address</label>
	// 								<input type="email" name="dzEmail" class="form-control" required placeholder="Enter Email Address">
	// 							</div>
	// 							<button name="submit" type="submit" value="Submit" class="btn btn-secondary btn-block m-b15 text-uppercase">Subscribe</button>
	// 							<div class="custom-checkbox">
	// 								<input type="checkbox" class="form-check-input" id="basic_checkbox_3">
	// 								<label class="form-check-label" for="basic_checkbox_3">I agree to receive marketing materials</label>
	// 							</div>
	// 						</form>
	// 					</div>
	// 				</div>
	// 			</div>
	// 		</div>
	// 	</div>`;

	// 	if(getCookie('prevent_subscription') != 'true'){
	// 		jQuery('body').append(modalBox);
	// 		setTimeout(function() {
	// 			jQuery("#myModal").modal('show');
	// 		}, 5000)
	// 	}
	// }
	
	var setCookie = function(cname, cvalue, exhours) {
		console.log('blabla');
		var d = new Date();
		d.setTime(d.getTime() + (30*60*1000)); /* 30 Minutes*/
		var expires = "expires="+ d.toString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
		
	}

	var getCookie = function(cname) {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	var deleteCookie = function(cname) {
		var d = new Date();
		d.setTime(d.getTime() + (1)); /* 1/1000 second*/
		var expires = "expires="+ d.toString();
		document.cookie = cname + "=1;" + expires + ";path=/";
	}
	
	var handleOpenModalCookie = function(){
		$(document).on('click','.modal-content .btn-close',function(){
			console.log('blabla');
			setCookie('prevent_subscription','true',60);
		}); 
	}

	
	/* Heart TextChar ============ */
	var handleTextChar = function () {
		var wordRoateElements = document.querySelectorAll('.word-rotate');
		wordRoateElements.forEach((data, _) => {
			var wordRoate = $(data).text().split('');
			const step = 360 / wordRoate.length;
			wordRoate.forEach((el, i) => {
				$(data).closest('.word-rotate-box').append('<span class="text__char" style="--char-rotate :' + (i * step) + 'deg">' + el + '</span>');
			})
			$(data).remove();
		})
	}
	
	var handleDzLoadMore = function() {
		$('.btn-process').on('click', function(e) {
			$(".btn-ring").show();
			$(".btn-process").prop('disabled',true); 
			$(".btn-process").val('disabled'); 
			e.preventDefault();	//STOP default action
			var dzLoadMoreUrl = $(this).attr('rel');
			setTimeout(function() {
				$.ajax({
					method: "POST",
					url: dzLoadMoreUrl,
					dataType: 'html',
					success: function(data) {
						$(".loadmore-content").append(data);					
						$(".btn-ring").hide();
						$(".btn-process").prop('disabled',false);
					}
				})
			}, 3000);
		});
	}
	
	var setCurrentYear = function(){
		const currentDate = new Date();
		let currentYear = currentDate.getFullYear();
	   let elements = document.getElementsByClassName('current-year'); 

		  for (const element of elements) {
		  element.innerHTML = currentYear;
	  }

	}
	
	
	/* Function ============ */
	return {
		init:function(){
			boxHover();
			wow_animation();
			onePageLayout();
			dzTheme();
			homeSearch();
			MagnificPopup();
			scrollTop();
			headerFix();
			handleVideo();
			handleFilterMasonary();
			handleCountDown(WebsiteLaunchDate);
			handleBannerResize();
			handelResize();
			jQuery('.modal').on('show.bs.modal', reposition);
			priceslider();
			handleCurrentActive();
			handleShopCart();
			handleBootstrapTouchSpin();
			handleSelectpicker();
			handleSmartWizard();
			dzCategoryToggle();
			handleActiveBTN();
			handleComingSoonCounter();
			handleShopPannel();
			handleHeaderMenuItem();
			cartButton();
			handleColorFilter();
			handleLightgallery();
			//handleOpenModal();
			// handleSupport();
			menuHover();
			wishlistBtn();
			navScroller();
			handleMagnifyGallery();
			handleOpenModalCookie();
			handleTextChar();
			handleDzLoadMore();
			/* contactform(); */
			handleShowPass();
			setCurrentYear();
		},

		load:function(){
			counter();
			masonryBox();
			handleMultipleImageSize();
			handleIsotope();
			handleOpenModal();
			jQuery('.modal').on('show.bs.modal', reposition);
		},
		
		resize:function(){
			screenWidth = $(window).width();
			
			dzTheme();	
			//handleShopPannel();
			handleMultipleImageSize();
			handleMagnifyGallery();
		}
	}
	
}();


/* Document.ready Start */	
jQuery(document).ready(function() {
    'use strict';
	
	petperks.init();
	
	$('a[data-bs-toggle="tab"]').click(function(){
		// todo remove snippet on bootstrap v4
		$('a[data-bs-toggle="tab"]').click(function() {
		  $($(this).attr('href')).show().addClass('show active').siblings().hide();
		})
	});	
		
	jQuery('.navicon').on('click',function(){
		$(this).toggleClass('open');
	});
	
});
/* Document.ready END */

/* Window Load START */
jQuery(window).on('load',function () {
	'use strict'; 
	
	petperks.load();
	
	setTimeout(function(){
		jQuery('#loading-area').remove();
	}, 2000);
	document.body.addEventListener('keydown', function () {
		document.body.classList.add('show-focus-outline');
	});

	document.body.addEventListener('mousedown', function () {
		document.body.classList.remove('show-focus-outline');
	});
	
});
/*  Window Load END */

/* Window Resize START */
jQuery(window).on('resize',function () {
	'use strict'; 
	petperks.resize();
});
/*  Window Resize END */


 document.addEventListener("DOMContentLoaded", function() {
    // Auto-show modal
    setTimeout(function() {
      var myModal = new bootstrap.Modal(document.getElementById('comingSoonModal'));
      myModal.show();
    }, 1000);

    // Countdown Timer (30 days from now)
    const countdownDate = new Date();
    countdownDate.setDate(countdownDate.getDate() + 30);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = countdownDate - now;

      if (distance < 0) {
        document.getElementById("countdown").innerHTML = "<p class='fw-bold text-success'>We're Live Now! 🎉</p>";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById("days").textContent = days.toString().padStart(2, '0');
      document.getElementById("hours").textContent = hours.toString().padStart(2, '0');
      document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
      document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  });