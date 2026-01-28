
const { exec } = require('child_process');

// Function to curl a protected route and check for redirect
function checkRedirect() {
    // Assuming frontend is running on 3000. 
    // We check a non-existent public route that should be protected, or a protected one.
    // /orcamentos is protected.
    const cmd = 'curl -I http://localhost:3000/orcamentos';

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        // Check for 307 Temporary Redirect usually used by NextResponse.redirect
        // Or 302/303 depending on implementation. But NextResponse.redirect is often 307 by default or 303.
        // Check if Location header points to /login

        if (stdout.includes('307 Temporary Redirect') && stdout.includes('Location: http://localhost:3000/login')) {
            console.log('SUCCESS: Redirected to /login');
        } else if (stdout.includes('Location: /login')) {
            console.log('SUCCESS: Redirected to /login');
        } else {
            console.log('FAILURE: Did not redirect as expected.');
            console.log(stdout);
        }
    });
}

// Give server a moment if it just restarted, though we didn't restart it explicitly.
// But we can just try running it.
checkRedirect();
