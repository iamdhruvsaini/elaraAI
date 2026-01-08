export const getBaseUrl = () => {
    if(process.env.NEXT_PUBLIC_API_BASE_URL) {
        return process.env.NEXT_PUBLIC_API_BASE_URL;
    }else{
        return "http://localhost:8000";
    }
}