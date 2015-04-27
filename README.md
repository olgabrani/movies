### Description

This client-side single page application uses the [Rotten Tomatoes JSON API](http://developer.rottentomatoes.com/io-docs).
When users visit MovieRama they see a list of the movies of the week.
Users can search for movies and view details on the movie by clicking on it.


### Options

The configurable options are the country (`country`), the amount of movies in theaters to show per page (`page_limit`), the apikey (`apikey`), the max number of similar movies that will be fetched if available (`similar_limit`) and the max amount of reviews that will be visible (`reviews_limit`).
Their default values are:

```
var options = {
    country: 'us',
    apikey: 'qtqep7qydngcc7grk4r4hyd9',
    page_limit: 10,
    similar_limit: 5,
    reviews_limit: 2
}
```

### Search 

The app is set to trigger user search when the user has typed at least 2 characters.
Moreover, the search is triggered every 300ms to avoid unnecessary ajax calls.


