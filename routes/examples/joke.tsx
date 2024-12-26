import Joke from "../../islands/Joke.tsx";

export default function JokePage() {
  return (
    <div class="prose max-w-none bg-base-200 p-6 rounded-box shadow-md border border-primary">
      <div class="p-4 mx-auto max-w-screen-md">
        <Joke />
      </div>
    </div>
  );
}
