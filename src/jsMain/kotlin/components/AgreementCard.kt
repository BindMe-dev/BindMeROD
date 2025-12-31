package components

import react.*
import react.dom.html.ReactHTML.*
import emotion.react.css
import web.cssom.*
import theme.Colors

external interface AgreementCardProps : Props {
    var type: String
    var icon: String
    var counterparty: String
    var rating: Double
    var status: String
    var amount: String
    var progress: Double
    var dueDate: String
    var statusColor: String
}

val AgreementCard = FC<AgreementCardProps> { props ->
    div {
        css {
            backgroundColor = Colors.White.unsafeCast<Color>()
            borderRadius = 16.px
            padding = 1.rem
            marginBottom = 0.75.rem
            borderLeft = Border(4.px, LineStyle.solid, props.statusColor.unsafeCast<Color>())
            boxShadow = BoxShadow(0.px, 2.px, 8.px, rgba(0, 0, 0, 0.1))
        }
        
        div {
            css {
                display = Display.flex
                justifyContent = JustifyContent.spaceBetween
                alignItems = AlignItems.flexStart
                marginBottom = 0.75.rem
            }
            
            div {
                css {
                    display = Display.flex
                    alignItems = AlignItems.center
                    gap = 0.75.rem
                }
                
                span {
                    css {
                        fontSize = 1.5.rem
                    }
                    +props.icon
                }
                
                div {
                    h3 {
                        css {
                            fontSize = 1.rem
                            fontWeight = FontWeight.semiBold
                            color = Colors.Slate900.unsafeCast<Color>()
                            marginBottom = 0.25.rem
                        }
                        +props.type
                    }
                    
                    div {
                        css {
                            display = Display.flex
                            alignItems = AlignItems.center
                            gap = 0.5.rem
                            fontSize = 0.875.rem
                            color = "#64748B".unsafeCast<Color>()
                        }
                        
                        +props.counterparty
                        
                        span {
                            css {
                                color = Colors.AmberAccent.unsafeCast<Color>()
                            }
                            +"⭐ ${props.rating}"
                        }
                    }
                }
            }
            
            span {
                css {
                    backgroundColor = when (props.status) {
                        "Active" -> Colors.TealPrimary.unsafeCast<Color>()
                        "Pending Blind Sign" -> Colors.AmberAccent.unsafeCast<Color>()
                        "Completed" -> "#10B981".unsafeCast<Color>()
                        else -> "#64748B".unsafeCast<Color>()
                    }
                    color = Colors.White.unsafeCast<Color>()
                    padding = Padding(0.25.rem, 0.5.rem)
                    borderRadius = 12.px
                    fontSize = 0.75.rem
                    fontWeight = FontWeight.medium
                }
                +props.status
            }
        }
        
        div {
            css {
                display = Display.flex
                justifyContent = JustifyContent.spaceBetween
                alignItems = AlignItems.center
            }
            
            div {
                css {
                    fontSize = 1.25.rem
                    fontWeight = FontWeight.bold
                    color = Colors.Slate900.unsafeCast<Color>()
                }
                +props.amount
            }
            
            div {
                css {
                    fontSize = 0.875.rem
                    color = "#64748B".unsafeCast<Color>()
                }
                +props.dueDate
            }
        }
        
        if (props.progress > 0) {
            div {
                css {
                    width = 100.pct
                    height = 4.px
                    backgroundColor = Colors.Slate200.unsafeCast<Color>()
                    borderRadius = 2.px
                    marginTop = 0.75.rem
                    overflow = Overflow.hidden
                }
                
                div {
                    css {
                        width = (props.progress * 100).pct
                        height = 100.pct
                        background = Colors.TealGradient
                        borderRadius = 2.px
                    }
                }
            }
        }
    }
}