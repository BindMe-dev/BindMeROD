package components

import react.*
import react.dom.html.ReactHTML.*
import emotion.react.css
import web.cssom.*
import theme.Colors
import react.router.useNavigate
import react.router.useLocation

val BottomNavigation = FC<Props> {
    val navigate = useNavigate()
    val location = useLocation()
    
    val navItems = arrayOf(
        NavItem("Agreements", "📄", "/dashboard"),
        NavItem("Network", "👥", "/network"),
        NavItem("Activity", "📊", "/activity"),
        NavItem("Profile", "⭐", "/profile")
    )
    
    nav {
        css {
            position = Position.fixed
            bottom = 0.px
            left = 0.px
            right = 0.px
            backgroundColor = Colors.White.unsafeCast<Color>()
            borderTop = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
            padding = 1.rem
            display = Display.flex
            justifyContent = JustifyContent.spaceAround
            zIndex = integer(1000)
        }
        
        navItems.forEach { item ->
            val isActive = location.pathname == item.path
            
            button {
                css {
                    background = if (isActive) Colors.TealGradient else "transparent"
                    border = None.none
                    borderRadius = 12.px
                    padding = Padding(0.75.rem, 1.rem)
                    cursor = Cursor.pointer
                    display = Display.flex
                    flexDirection = FlexDirection.column
                    alignItems = AlignItems.center
                    gap = 0.25.rem
                    color = if (isActive) Colors.White.unsafeCast<Color>() else "#64748B".unsafeCast<Color>()
                    transform = if (isActive) scale(1.05) else scale(1.0)
                    transition = "all 0.2s ease".unsafeCast<Transition>()
                }
                
                onClick = {
                    navigate(item.path)
                }
                
                span {
                    css {
                        fontSize = 1.25.rem
                    }
                    +item.icon
                }
                
                span {
                    css {
                        fontSize = 0.75.rem
                        fontWeight = if (isActive) FontWeight.semiBold else FontWeight.normal
                    }
                    +item.label
                }
            }
        }
    }
}

data class NavItem(
    val label: String,
    val icon: String,
    val path: String
)