var playAudio;
var audio;
var artist_obj = [];
var id_count = -1;
var playing_id;
var error;
var songPlaying = false;
var results;


var searchType = "music";
// key for tasteDiveKey
var tasteDiveKey = "348203-ClassPro-YG3CBL5R";
// search limit for the aip to result 
var searchLimit = 9;
var resultsArray = [];
var newRow;

function renderSongDataAttributes(playButton, result) {
    $(playButton).attr({
        "data-song-name": result.trackName,
        "data-song-price": result.trackPrice,
        "data-song-rating": result.trackExplicitness,
        "data-song-releaseDate": result.releaseDate,
        "data-song-url": result.previewUrl,
        "data-song-track-number": result.trackNumber,
        "data-song-duration": result.trackTimeMillis,
        "data-song-id": result.songId,
        "data-album-id": result.albumId,
        "data-album-genre": result.primaryGenreName,
        "data-album-image-url": result.artworkUrl100,
        "data-album-rating": result.contentAdvisoryRating,
        "data-album-name": result.collectionName,
        "data-album-price": result.collectionPrice
    });

}

function renderSongDisplay(result) {
    var songDisplayTable = $(".song-display-table");
    newRow = $(".song-display-row").clone();
    var playButton = $(newRow.children()[2]).children()[0];

    renderSongDataAttributes(playButton, result);
    $(newRow.children()[1]).text(result.trackName);

    songDisplayTable.append(newRow);
}

function createArtist(result) {
    var artistId = result.artistId.toString();
    console.log("adding artist");
    console.log(artistId);
    console.log(result.artistName);

    db.collection("Artists").doc(artistId).set({
        name: result.artistName
    });
}

function addUserArtistEntry(user, result) {

    console.log(user);
    console.log(result.artistId);
    db.collection("ArtistsUsers").add({
        userId: user,
        artistId: result.artistId
    });
}

function createArtistAlbumEntry(result) {
    console.log("adding artist album entry");

    db.collection("ArtistsAlbums").add({
        artistId: result.artistId,
        albumId: result.collectionId
    });
}

function createAlbum(result) {
    console.log("adding album to database");
    var albumId = result.collectionId.toString();
    console.log(albumId);

    db.collection("Albums").doc(albumId).set({
        genre: result.primaryGenreName,
        imageURL: result.artworkUrl100,
        rating: result.contentAdvisoryRating,
        name: result.collectionName,
        price: result.collectionPrice
    });

    createArtistAlbumEntry(result);
}

function createAlbumSongEntry(result) {
    console.log("adding album song entry");

    db.collection("AlbumsSongs").add({
        albumId: result.collectionId,
        songId: result.trackId
    });
}

function createSong(result) {
    console.log("we're adding a song");
    var trackId = result.trackId.toString()
    console.log(trackId);

    db.collection("Songs").doc(trackId).set({
        name: result.trackName,
        price: result.trackPrice,
        rating: result.trackExplicitness,
        releaseDate: result.releaseDate,
        songURL: result.previewUrl,
        trackNumber: result.trackNumber,
        duration: result.trackTimeMillis
    });

    createAlbumSongEntry(result)
}


$(document).ready(function () {
    $(".modal").modal();

    $("#userArtistInput").on("click", function (event) {
        event.preventDefault();

        if ($("#userSearch").val() == "") {
            console.log("shake");
            $("#empty-alert").removeClass("off");
            $("#userSearch").effect("shake");
        }

        if ($("#userSearch").val() != "") {
            $(".errorStyle").empty();
            $("#empty-alert").addClass("off");
            $(".main-search-result-continer").find(".col").empty();
            id_count = 0;
            resultsArray = [];
            artist_obj = [];


            var searchValue = $("#userSearch").val().trim().toUpperCase();

            $(".recomendations-result-container").text(searchValue);

            tasteDive(searchValue, searchType, tasteDiveKey, searchLimit);
        };

        function tasteDive(value, type, key, limit) {
            queryURL = "https://cors-anywhere.herokuapp.com/" + "https://tastedive.com/api/similar?q=" + value + "&type=" + type + "&k=" + key + "&limit=" + limit;
            $.ajax({
                url: queryURL,
                method: "GET"
            }).then(function (results) {
                results.Similar.Results.forEach(function (item) {
                    resultsArray.push(item.Name);
                });

                if (resultsArray.length == 0) {
                    error = true;
                    console.log("error");
                    var error = $("<p>");
                    error.attr("class", "errorStyle");
                    error.text(searchValue + " was not found. Please try again.");
                    $(".main-search-result-continer").append(error);
                }
                else {
                    console.log(artist_obj)
                    callItunesAPI();
                };
            });
            $("#userSearch").val('');
        }

        function callItunesAPI() {
        
            for (var i = 0; i < resultsArray.length; i++) {
                var artist;
                var artistNameFromArray = resultsArray[i]
                var queryURL = "https://cors-anywhere.herokuapp.com/" + "https://itunes.apple.com/search?term=" + artistNameFromArray + "&limit=25";
                $.ajax({
                    url: queryURL,
                    method: "GET"
                })
                    .then(function (response) {
                        var result = JSON.parse(response).results;
                        artist = {
                            name: result[i].artistName,
                            genre: result[i].primaryGenreName,
                            imageURL: result[i].artworkUrl100,
                            songName: result[i].trackName,
                            songURL: result[i].previewUrl
                        };
                        
                        id_count++;
                        cardDisplay(id_count, artist);
                    });
                    
                var audioQueryURL = "https://cors-anywhere.herokuapp.com/" + "theaudiodb.com/api/v1/json/1/search.php?s=" + artistNameFromArray;

                $.ajax({
                    url: audioQueryURL,
                    method: "GET"
                })
                    .then(function (response) {
                        // console.log(response);
                        var result = response.artists;
                        // console.log("audio" +result);
                        var artistBio = result[0].strBiographyEN;
                        // console.log(typeof artistBio);
                       
                        // console.log(result[0].strBiographyEN);
                            // console.log(artist);
                            console.log(artistBio + "bio");
                        artist.artistDescription = artistBio;
                        artist_obj.push(artist);
                        console.log(artist);


                    });

            };
        }
    });
    


    function cardDisplay(item, object_artist) {
        // create cards
        var masterCard = $("#card");
        var newCard = masterCard.clone(true);
        newCard.attr("id", "card" + (item));
        newCard.removeClass("off");
        newCard.find(".artist-image").attr("src", object_artist.imageURL);
        newCard.find(".artist-name").text(object_artist.name);
        newCard.find(".genre").text("Genre: " + object_artist.genre);
        newCard.find(".song").text("Track Name: " + object_artist.songName);
        newCard.find(".imageClick").attr("src", object_artist.songURL);
        newCard.attr(artistDescription, artistBio);
        $("#" + (item)).append(newCard);
    };


    $(document).on("click", ".imageClick", function () {
        console.log(songPlaying);
        console.log($(this).attr("data-audio-status"));
        console.log(playing_id)

        if (songPlaying == false) {
            if ($(this).attr("data-audio-status") != "playing") {
                playAudio = $(this).attr("src");
                audio = new Audio(playAudio);
                audio.play();
                $(this).attr("data-audio-status", "playing");
                songPlaying = true;
                playing_id = $(this).closest(".col").attr("id");
            }
        }

        else if (songPlaying == true) {
            if ($(this).attr("data-audio-status") == "playing") {
                audio.pause();
                $(this).attr("data-audio-status", "paused");
                songPlaying = false;
            }
            else if ($(this).attr("data-audio-status") != "playing") {
                audio.pause();
                $("#" + playing_id).find(".imageClick").attr("data-audio-status", "paused");
                playAudio = $(this).attr("src");
                audio = new Audio(playAudio);
                audio.play();
                $(this).attr("data-audio-status", "playing");
                playing_id = $(this).closest(".col").attr("id");
            }
        }
    });

    $(".modal-trigger").on("click", function () {
        // check if shit exists in the database or not
        // console.log("we got in the function");
        // var queryURL = "https://cors-anywhere.herokuapp.com/" + "https://itunes.apple.com/search?term=" + $(this).text() + "&limit=25";
        // console.log(queryURL);

        // $.ajax({
        //     url: queryURL,
        //     method: "GET"
        // }).then(response => {
        //     results = JSON.parse(response).results;
        //     results.forEach(result => {
        //         renderSongDisplay(result);
        //     })

        // });
        var modelId= $(this).closest(".col").attr("id");
        $("#artistDescription").text(artist_obj[modelId-1]);

    });

    $(document).on("click", ".add-music-button", function () {
        console.log("we clicked this friend");
    });
});