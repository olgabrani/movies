function App(options){

  this.host = 'http://api.rottentomatoes.com/api/public/v1.0/';
  this.options = options;
  this.country = options.country || 'us';
  this.api_key = options.apikey || 'qtqep7qydngcc7grk4r4hyd9';
  this.page_limit = options.page_limit || 10;
  this.similar_limit = options.similar_limit || 5;
  this.reviews_limit = options.reviews_limit || 2;

  this.ajaxTimeout = 5000;

  this.search_input = $('input');
  this.search_button = $('#search');
  this.results_theater = $('#results-theater');
  this.results_search = $('#results-search');
  this.theater_title = $('#theater-title');
  this.search_title = $('#search-title');
  this.error_message = $('#error-message');
  this.results_loader = $('#loader');
  this.init_loader = $('#init-loader');
  this.movies_html = $('#movies-template').html();
  this.movie_html = $('#movie-template').html();
  this.reviews_html = $('#reviews-template').html();
  
  this.movies_template = Handlebars.compile(this.movies_html);
  this.movie_template = Handlebars.compile(this.movie_html);
  this.reviews_template = Handlebars.compile(this.reviews_html);
  
  this.initEvents();

}

// Initialize counters and bind events
App.prototype.initEvents = function() {

  // Initialize counters
  this.total = 0;
  this.theater_total = 0;
  this.current_page = 0;
  this.search_index = 0;
  this.theater_index = 0;

  // Initially populate results with this week's movies in theaters
  this.findMoviesTheaters();

  var self = this;

  // Trigger search on search button click
  this.search_button.click(function(e) {
      e.preventDefault();
      self.triggerFind();
  });

  // Trigger search on search input keyup every 0.3sec in order to avoid 
  // some ajax calls
  this.search_input.on("keyup", _.debounce( _.bind(self.triggerFind, self), 300));

  // Toggle detailed movie info on movie click
  $('body').on('click', 'ul.results>li', _.bind(self.toggleInfo, self));

  // Load more data (if available) when user scrolls to the end of the document
  $(window).scroll(function() {
      if ($(window).scrollTop() + $(window).height() === $(document).height()) {
          self.infiniteScroll();
      }
  });

}


// Determines whether to search a movie or show movies in theaters.
App.prototype.triggerFind = function(){

  var q = this.search_input.val().trim();

  // If the input is empty, do nothing if movies in theaters are already 
  // visible or show them if search results are visible
  if ( q.length === 0) {
    if (this.search_index === 0 ) { return; }
    this.resetSearch();
    this.resetTheater();
  }

  // Trigger search if the user has submitted at least 2 charcters
  if ( q.length > 1) {
    this.resetSearch();
    this.results_theater.hide();
    this.theater_title.hide();
    this.searchMovies();
  }

}


// Data sent to the API including apikey
App.prototype.ajaxKeyData = function() {
  return {
    apikey: this.api_key
  };
}

// Data sent to the API including page_limit, apikey, country, and current page
App.prototype.ajaxSendData = function(page) {
  return {
    page_limit: this.page_limit,
    apikey: this.api_key,
    country: this.country,
    page: page
  };
}


// Sets the current @param page
App.prototype.setCurrentPage = function(page) {
  this.current_page = page;
};

// @method resetSearch clears all search results and results title, and hides 
// previous error messages and loaders.
// The method is called when a new search is triggered
App.prototype.resetSearch = function() {
  this.error_message.hide();
  this.search_index = 0;
  this.init_loader.show();
  this.results_search.empty();
  this.search_title.empty();
}


// @method clearAll clears all movies results (from search and in theaters)
App.prototype.clearAll = function() {
  this.resetSearch();
  this.theater_title.hide();
  this.results_search.empty();
  this.init_loader.hide();
  this.theater_index = 0;
}

// @method resetTheater uses resets search and then shows previous fetched
// theater results and restores current page index  
App.prototype.resetTheater = function() {
  this.init_loader.hide();
  this.results_theater.show();
  this.theater_title.show();
  this.setCurrentPage(this.theater_index);
  this.total = this.theater_total;
}


// Sends an ajax call to the endpoint
// /api/public/v1.0/lists/movies/in_theaters.json
App.prototype.findMoviesTheaters = function() {
  var self = this;
  this.theater_index++;
  var data = this.ajaxSendData(this.theater_index);
  $.ajax({
    type: "GET",
    url: self.host + "lists/movies/in_theaters.json",
    data: data,
    dataType: "jsonp",
    timeout: self.ajaxTimeout,
  }).then(function(data) {
    self.init_loader.hide();
    self.total = data.total;
    self.results_loader.hide();
    self.theater_total = data.total;
    self.setCurrentPage(self.theater_index);
    data.list_title = (data.total || 0)+ ' movies in theaters this week';
    self.theater_title.html(data.list_title);
    self.populateList(data, self.results_theater);
  }, function(jqXHR, textStatus, errorThrown) {
      self.handleApiError();
  });
}


// Sends an ajax call to the endpoint
//  /api/public/v1.0/movies.json
App.prototype.searchMovies = function() {
  var self = this;
  this.search_index++;
  var data = this.ajaxSendData(this.search_index);
  data.q = this.search_input.val().trim();
  $.ajax({
    type: "GET",
    url: self.host + "movies.json",
    data: data,
    dataType: "jsonp",
    timeout: self.ajaxTimeout,
  }).then(function(data) {
    self.init_loader.hide();
    self.results_loader.hide();
    self.total = data.total;
    self.setCurrentPage(self.search_index);
    data.list_title = 'Found ' + (data.total || 0) + ' movies';
    self.search_title.html(data.list_title);
    self.populateList(data, self.results_search);
  }, function(jqXHR, textStatus, errorThrown) {
    self.handleApiError();
  });
}


// Finds details of a movie using:
// /api/public/v1.0/movies/:id.json
// @param {integer} id is the movie id
App.prototype.findMovie = function(id) {
  return $.ajax({
    type: "GET",
    url: this.host + "movies/" + id + ".json",
    data: this.ajaxKeyData(),
    dataType: "jsonp",
    timeout: this.ajaxTimeout,
  });
}

// Finds similar movies of a movie using:
// /api/public/v1.0/movies/:id/similar.json
// @param {integer} id is the movie id
App.prototype.findMovieSimilar = function(id) {
  var data = this.ajaxKeyData();
  data.limit = this.similar_limit;
  return $.ajax({
    type: "GET",
    url: this.host + "movies/" + id + "/similar.json?",
    data: data,
    dataType: "jsonp",
    timeout: this.ajaxTimeout,
  });
}

// Finds details of a movie using:
// /api/public/v1.0/movies/:id/reviews.json
// @param {integer} id is the movie id
App.prototype.findMovieReviews = function(id) {
  var data = this.ajaxKeyData();
  data.page_limit = this.reviews_limit;
  return $.ajax({
    type: "GET",
    url: this.host + "movies/" + id + "/reviews.json?",
    data: data,
    dataType: "jsonp",
    timeout: this.ajaxTimeout,
  });
}


// Clears all results and shows an error message.
// Is called when findMoviesTheaters or searchMovies fail.
App.prototype.handleApiError = function() {
  this.clearAll();
  this.error_message.html('An API error occured');
  this.error_message.show();
}


// Iterate over @param data to keep a max number of abridged_cast to 3 and then
// call @method handlebarsAppend to append data to the @param el DOM element.
App.prototype.populateList = function(data, el) {
  // Show only 3 people of the cast
  _.each(data.movies, function(m) {
    m.abridged_cast = m.abridged_cast.slice(0, 3);
  })
  this.handlebarsAppend(el, this.movies_template, data);
}

// Calculate if there are more results than the ones shown currently in the 
// document
App.prototype.hasMoreToFetch = function() {
  return (this.total - (this.current_page * this.page_limit)) > 0;
}

// If there are more results resume ajax call
App.prototype.infiniteScroll = function() {
  if (!(this.hasMoreToFetch())) {
    return;
  }
  this.results_loader.show();
  if (this.search_index > 0) {
    this.searchMovies();
  } else if (this.theater_index > 0) {
    this.findMoviesTheaters();
  }
}


// Uses handlebars to render @param data into the @param template and then
// append this to the @param el DOM element
App.prototype.handlebarsAppend = function(el, template, data) {
  el.append(template(data));
}

// Is called when the user click in the element containing the movie
App.prototype.toggleInfo = function(e) {

  var self = this;
  var el = $(e.currentTarget);

  // Allow movie inner anchors to be clickable
  if (e.target.nodeName === 'A') {
      return;
  }

  el.toggleClass('open');

  // If data is alredy fetched do not make the call again
  if (el.hasClass('fetched')) {
    el.find('.short-info').toggle();
    el.find('.extras').toggle();
    return false;
  }

  var loader = el.find('.extras-loader');
  loader.show();

  var id = el.data('id');
  // Show detailed movie info only when findMovie, findMovieSimilar and findMovieReviews ajax calls have 
  // succeeded. If not show an error message
  $.when(self.findMovie(id), self.findMovieSimilar(id), self.findMovieReviews(id)).then(function(a1, a2, a3) {
    loader.hide();

    var movie_data = {
      movie: a1[0],
      similar: a2[0].movies
    };

    var reviews_data = {
      reviews: a3[0].reviews
    };

    el.find('.short-info').hide();
    // Mark this movie as fetched
    el.addClass('fetched');

    self.handlebarsAppend(el.find('.details'), self.movie_template, movie_data);
    self.handlebarsAppend(el.find('.reviews'), self.reviews_template, reviews_data);
  }, function(jqXHR, textStatus, errorThrown) {
    loader.html('Could not fetch more data');
  });
}
