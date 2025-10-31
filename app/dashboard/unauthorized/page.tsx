import { Loader } from "@/components/atom/Loader";

const App = () => (
  <div className="w-full h-full flex justify-center items-center">
    <div className="w-[90vw] h-[90vh] max-w-xl max-h-40 flex flex-col justify-center items-center rounded-lg shadow-xl bg-white">
      <Loader></Loader>
      <h1>Parece ser que no tienes autorizada esta pantalla</h1>
    </div>
  </div>
);

export default App;
