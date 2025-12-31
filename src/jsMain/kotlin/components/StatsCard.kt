package components

import react.*
import react.dom.html.ReactHTML.*
import emotion.react.css
import web.cssom.*
import theme.Colors

external interface StatsCardProps : Props {
    var title: String
    var value: String
    var gradient: String
}

val StatsCard = FC<StatsCardProps> { props ->
    div {
        css {
            background = props.gradient
            borderRadius = 16.px
            padding = 1.rem
            color = Colors.White.unsafeCast<Color>()
            textAlign = TextAlign.center
        }
        
        div {
            css {
                fontSize = 1.5.rem
                fontWeight = FontWeight.bold
                marginBottom = 0.25.rem
            }
            +props.value
        }
        
        div {
            css {
                fontSize = 0.875.rem
                opacity = number(0.9)
            }
            +props.title
        }
    }
}