import axios from 'axios';

const api = axios.create({
    baseURL: 'https://demo.inkless.digital/api',
    //baseURL: 'https://gastrovita.inkless.digital/api',
    
});

export default api;