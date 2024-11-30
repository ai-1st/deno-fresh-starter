import { useEffect, useState } from "preact/hooks";
import { FunctionComponent } from "preact";

interface JokeResponse {
  error: boolean;
  category: string;
  type: string;
  setup?: string;
  delivery?: string;
  joke?: string;
  flags: {
    nsfw: boolean;
    religious: boolean;
    political: boolean;
    racist: boolean;
    sexist: boolean;
    explicit: boolean;
  };
  safe: boolean;
  id: number;
  lang: string;
}

const Joke: FunctionComponent = () => {
  const [joke, setJoke] = useState<JokeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoke = async () => {
    setIsLoading(true);
    setJoke(null);
    setError(null);
    
    try {
      const response = await fetch('https://v2.jokeapi.dev/joke/Any');
      if (!response.ok) {
        throw new Error('Failed to fetch joke');
      }
      const data = await response.json();
      setJoke(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch joke');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300 ease-in-out relative z-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Random Joke Island 🏝️</h1>
      
      {isLoading && (
        <div className="text-center text-gray-600">Loading your joke...</div>
      )}
      
      {error && (
        <div className="text-center text-red-500">
          Error: {error}
        </div>
      )}
      
      {joke && !isLoading && !error && (
        <div className="space-y-4">
          <div className="text-lg text-gray-800">
            {joke.type === 'twopart' ? (
              <>
                <p className="font-semibold mb-4">{joke.setup}</p>
                <p className="italic">{joke.delivery}</p>
              </>
            ) : (
              <p>{joke.joke}</p>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-4">
            Category: {joke.category}
          </div>
        </div>
      )}
      
      <button 
        onClick={fetchJoke}
        className="mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
      >
        Get Another Joke
      </button>
    </div>
  );
};

export default Joke;
