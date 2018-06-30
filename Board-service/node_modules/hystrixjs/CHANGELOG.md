# 0.2.0 (2017-05-25)

### BREAKING CHANGES

* Removed explicit dependency to rx and added peer dependency to rxjs(5.0.0). If your project is using hystrix stream feature, it will now have to add an explicit dependency to rx or rxjs. (thank you [jgorman](https://bitbucket.org/jgorman/))

To migrate you need to add an explicit dependency to rx in your project

### Features

* add cumulative sum to the metrics (thank you [dimichgh](https://bitbucket.org/dimichgh/)
* add metrics for successful and failed executions of fallback (thank you [dimichgh](https://bitbucket.org/dimichgh/)

### Bug Fixes

* hystrix stream enforces the update of rolling window, preventing showing the same data, if there are not requests
