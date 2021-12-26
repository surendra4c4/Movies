const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const Path = require("path");
const dbPath = Path.join(__dirname, "moviesData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);

    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbMovieObjectToResponseObject = (object) => {
  return {
    movieId: object.movie_id,
    directorId: object.director_id,
    movieName: object.movie_name,
    leadActor: object.lead_actor,
  };
};

const convertDbDirectorObjectToResponseObject = (object) => {
  return {
    directorId: object.director_id,
    directorName: object.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getAllMovieNamesQuery = `
    SELECT movie_name FROM movie;`;

  const movieNames = await db.all(getAllMovieNamesQuery);
  response.send(
    movieNames.map((eachMovie) =>
      convertDbMovieObjectToResponseObject(eachMovie)
    )
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const createMovieSqlQuery = `INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (${directorId}, '${movieName}', '${leadActor}');`;

  const dbResponse = await db.run(createMovieSqlQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  try {
    let { movieId } = request.params;
    const getRequiredMovieQuery = `
    SELECT 
      *
    FROM 
      movie 
    WHERE 
      movie_id = ${movieId};`;

    const movieDetails = await db.get(getRequiredMovieQuery);
    response.send(convertDbMovieObjectToResponseObject(movieDetails));
  } catch (e) {
    console.log(`Db Error : ${e.message}`);
  }
});

app.put("/movies/:movieId", async (request, response) => {
  let { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieSqlQuery = `UPDATE movie
    SET director_id = ${directorId}, 
        movie_name = '${movieName}', lead_actor = '${leadActor}';`;

  const dbResponse = await db.run(updateMovieSqlQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieSqlQuery = `
  DELETE FROM
    movie
  WHERE
    movie_id = ${movieId};`;
  const deletedQuery = await db.run(deleteMovieSqlQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getAllDirectorsQuery = `
    SELECT * FROM director;`;

  const directorNames = await db.all(getAllDirectorsQuery);
  response.send(
    directorNames.map((eachDirector) =>
      convertDbDirectorObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertDbMovieObjectToResponseObject(eachMovie)
    )
  );
});

module.exports = app;
