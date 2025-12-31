package components

import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.h1
import react.dom.html.ReactHTML.p
import react.dom.html.ReactHTML.button
import emotion.react.css
import web.cssom.*
import kotlinx.coroutines.*
import theme.Colors
import react.router.useNavigate

val WelcomeScreen = FC<Props> {
    var currentPhrase by useState(0)
    var showStrikethrough by useState(false)
    var showCheckmark by useState(false)
    
    val phrases = arrayOf(
        "documented that £100 loan",
        "gotten it in writing", 
        "protected our friendship",
        "made it official",
        "had proof",
        "created an agreement"
    )
    
    val navigate = useNavigate()
    
    useEffect {
        val job = MainScope().launch {
            while (true) {
                delay(2000)
                showStrikethrough = true
                delay(500)
                showCheckmark = true
                delay(500)
                showStrikethrough = false
                showCheckmark = false
                currentPhrase = (currentPhrase + 1) % phrases.size
            }
        }
        cleanup { job.cancel() }
    }
    
    div {
        css {
            minHeight = 100.vh
            background = Colors.TealGradient
            display = Display.flex
            flexDirection = FlexDirection.column
            alignItems = AlignItems.center
            justifyContent = JustifyContent.center
            padding = 2.rem
            textAlign = TextAlign.center
        }
        
        div {
            css {
                backgroundColor = Colors.White
                borderRadius = 24.px
                padding = 3.rem
                maxWidth = 500.px
                boxShadow = BoxShadow(0.px, 20.px, 40.px, rgba(0, 0, 0, 0.1))
            }
            
            h1 {
                css {
                    fontFamily = string("'Outfit', sans-serif")
                    fontSize = 2.5.rem
                    fontWeight = FontWeight.bold
                    color = Colors.Slate900.unsafeCast<Color>()
                    marginBottom = 1.rem
                }
                +"BindMe"
            }
            
            p {
                css {
                    fontSize = 1.125.rem
                    color = Colors.Slate900.unsafeCast<Color>()
                    marginBottom = 2.rem
                    lineHeight = LineHeight(1.6)
                }
                +"I should have "
                
                span {
                    css {
                        if (showStrikethrough) {
                            textDecoration = TextDecoration.lineThrough
                            opacity = number(0.5)
                        }
                        transition = "all 0.3s ease".unsafeCast<Transition>()
                    }
                    +phrases[currentPhrase]
                }
                
                if (showCheckmark) {
                    span {
                        css {
                            color = Colors.TealPrimary.unsafeCast<Color>()
                            fontWeight = FontWeight.bold
                            marginLeft = 0.5.rem
                        }
                        +" I have! ✓"
                    }
                }
            }
            
            p {
                css {
                    fontSize = 1.rem
                    color = "#64748B".unsafeCast<Color>()
                    marginBottom = 2.rem
                    fontStyle = FontStyle.italic
                }
                +"\"The modern handshake - Because good friendships deserve clear agreements\""
            }
            
            button {
                css {
                    background = Colors.TealGradient
                    color = Colors.White.unsafeCast<Color>()
                    border = None.none
                    borderRadius = 16.px
                    padding = Padding(1.rem, 2.rem)
                    fontSize = 1.125.rem
                    fontWeight = FontWeight.semiBold
                    cursor = Cursor.pointer
                    width = 100.pct
                    transition = "transform 0.2s ease".unsafeCast<Transition>()
                    
                    hover {
                        transform = scale(1.02)
                    }
                }
                
                onClick = {
                    navigate("/dashboard")
                }
                
                +"Get Started"
            }
        }
    }
}