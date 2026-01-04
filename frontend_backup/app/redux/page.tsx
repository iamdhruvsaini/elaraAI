// "use client";
// import { useGetPokemonByNameQuery } from "@/redux/services/pokemon";
// import { useSelector } from "react-redux";

// const Page = () => {
//   const counter = useSelector((state: any) => state.counter.value);
//   const name = "pikachu";
//   const { data, isLoading, error } = useGetPokemonByNameQuery(name);

//   console.log(data);
//   if (isLoading) return <p>Loading...</p>;
//   if (error) return <p>Error</p>;
//   return <h1>{data?.name}</h1>;
// };

// export default Page;
