const app = require('../index');

console.log("app :", app);
app.listen(3000, () => (
    console.log("Running")
));

