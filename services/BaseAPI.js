const API_URL = "https://covid19.nunukan.net";

export function APIRequest(URL, mode = 'GET') {
    return new Promise((resolve, reject) => {
        fetch(`${API_URL}/${URL}`, {
            method: mode,
        })
            .then(response => response.json())
            .then(responseJSON => {
                resolve(responseJSON);
            })
            .catch(error => {
                reject(error);
            });
    });
}
