import react.*
import react.dom.client.createRoot
import kotlinx.browser.document
import kotlinx.browser.window
import emotion.react.css
import web.cssom.*

fun main() {
    val container = document.getElementById("root") ?: error("Couldn't find root container!")
    createRoot(container).render(App.create())
}

val App = FC<Props> {
    Router {
        Routes {
            Route {
                path = "/"
                element = WelcomeScreen.create()
            }
            Route {
                path = "/dashboard"
                element = Dashboard.create()
            }
            Route {
                path = "/create-agreement"
                element = CreateAgreement.create()
            }
            Route {
                path = "/network"
                element = NetworkScreen.create()
            }
            Route {
                path = "/activity"
                element = ActivityScreen.create()
            }
            Route {
                path = "/profile"
                element = ProfileScreen.create()
            }
        }
    }
}