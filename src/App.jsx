import React, { useState, useEffect } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.TMDB_API_KEY;

const API_OPTIONS = {
	method: "GET",
	headers: {
		accept: "application/json",
		Authorization: `Bearer ${API_KEY}`,
	},
};

const App = () => {
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [movieList, setMovieList] = useState([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [trendingMovies, setTrendingMovies] = useState([]);

	// Use debouncing to reduce API calls
	useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

	const fetchMovies = async (query = "") => {
		setIsLoading(true);
		setErrorMessage("");
		try {
			const endpoint = query
				? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
				: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

			const response = await fetch(endpoint, API_OPTIONS);

			if (!response.ok) {
				setMovieList([]); // Clear movie list on error
				throw new Error("Failed to fetch movies");
			}

			const data = await response.json();
			setMovieList(data.results || []);

			if (data.Response === "False") {
				setErrorMessage(data.Error || "Failed to fetch movies.");
			}

			if (query && data.results.length > 0) {
				await updateSearchCount(query, data.results[0]);
			}
		} catch (error) {
			console.error(`Error fetching movies: ${error}`);
			setErrorMessage("Error fetching movies, please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	const loadTrendingMovies = async () => {
		try {
			const movies = await getTrendingMovies();

			setTrendingMovies(movies);
		} catch (error) {
			console.error(`Error fetching trending movies: ${error}`);
		}
	};

	// Use debounced search term instead of the direct search term
	useEffect(() => {
		fetchMovies(debouncedSearchTerm);
	}, [debouncedSearchTerm]);

	useEffect(() => {
		loadTrendingMovies();
	}, []);

	return (
		<main>
			<div className='pattern' />

			<div className='wrapper'>
				<header>
					<img src='./hero.png' alt='Hero Background' />
					<h1>
						Find <span className='text-gradient'>Movies</span> You'll Love
						Without the Hassle.
					</h1>
					<Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
				</header>

				{trendingMovies.length > 0 && (
					<section className='trending'>
						<h2>Trending Movies</h2>

						<ul>
							{trendingMovies.map((movie, index) => (
								<li key={movie.$id}>
									<p>{index + 1}</p>
									<img src={movie.poster_url} alt={movie.title} />
								</li>
							))}
						</ul>
					</section>
				)}

				<section className='all-movies'>
					{/* Conditional rendering */}
					{isLoading ? (
						<Spinner />
					) : errorMessage ? (
						<p className='text-red-500'>{errorMessage}</p>
					) : (
						<ul>
							{movieList.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	);
};

export default App;
