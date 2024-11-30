import Joke from "../../islands/Joke.tsx";

export default function JokePage() {
  return (
    <div class="bg-gradient-to-b from-blue-100 to-blue-200 p-6">
      <div class="p-4 mx-auto max-w-screen-md">
        <Joke />
      </div>
    </div>
  );
}
