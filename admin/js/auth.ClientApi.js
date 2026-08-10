export async function protectedFetch(url, options = {}){
    //url wrapper inside
    const config = {
        method: options.method || "GET",
        credentials: "include",
        headers: {'Content-Type': 'application/json', ...(options.headers || {})}
    };

    if(options.body){
        config.body = JSON.stringify(options.body);
    }

    //first call
    const response = await fetch(url, config);
    if(response.ok){
        return response;
    }

    //error
    if(response.status === 401){
        const error = await response.clone().json();

        switch (error.code) {
            case "ACCESS_TOKEN_EXPIRED":
                const refreshResponse = await fetch('http://localhost:4000/api/v1/admin/refresh-token', {
                    method: 'POST',
                    credentials: "include"
                });

                //Recalling after new access created
                if(refreshResponse.ok){
                    return await fetch(url, config);
                }

                setTimeout(() => {
                window.location.href = '../html/login.html';
                }, 1200);
                return;
        
            case "ACCESS_TOKEN_INVALID":

            case "ACCESS_TOKEN_MISSING":

            case "AUTH_FAILED":

                setTimeout(() => {
                window.location.href = '../html/login.html';
                }, 1200);
                throw new Error("Authentication Failed. Redirecting...");

            default:
                return response;

        }
    }else{
         return response;
    }
}