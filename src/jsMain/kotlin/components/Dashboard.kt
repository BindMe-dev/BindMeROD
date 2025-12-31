package components

import react.*
import react.dom.html.ReactHTML.*
import emotion.react.css
import web.cssom.*
import theme.Colors

val Dashboard = FC<Props> {
    var searchQuery by useState("")
    var selectedFilter by useState("All")
    var showSearch by useState(false)
    var showFilter by useState(false)
    
    val filters = arrayOf("All", "Active", "Pending Blind Sign", "Completed")
    val filterCounts = mapOf(
        "All" to 12,
        "Active" to 5,
        "Pending Blind Sign" to 2,
        "Completed" to 5
    )
    
    div {
        css {
            minHeight = 100.vh
            backgroundColor = Colors.Slate50.unsafeCast<Color>()
            paddingBottom = 80.px // Space for bottom nav
        }
        
        // Header
        header {
            css {
                backgroundColor = Colors.White.unsafeCast<Color>()
                padding = 1.rem
                borderBottom = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
            }
            
            div {
                css {
                    display = Display.flex
                    justifyContent = JustifyContent.spaceBetween
                    alignItems = AlignItems.center
                    marginBottom = 1.rem
                }
                
                h1 {
                    css {
                        fontFamily = string("'Outfit', sans-serif")
                        fontSize = 1.5.rem
                        fontWeight = FontWeight.bold
                        color = Colors.Slate900.unsafeCast<Color>()
                    }
                    +"Dashboard"
                }
                
                div {
                    css {
                        display = Display.flex
                        gap = 0.5.rem
                    }
                    
                    // Search button
                    button {
                        css {
                            background = if (showSearch) Colors.TealPrimary else "transparent"
                            border = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
                            borderRadius = 12.px
                            padding = 0.75.rem
                            cursor = Cursor.pointer
                            color = if (showSearch) Colors.White.unsafeCast<Color>() else Colors.Slate900.unsafeCast<Color>()
                        }
                        onClick = { showSearch = !showSearch }
                        +"🔍"
                    }
                    
                    // Filter button
                    button {
                        css {
                            background = if (showFilter) Colors.TealPrimary else "transparent"
                            border = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
                            borderRadius = 12.px
                            padding = 0.75.rem
                            cursor = Cursor.pointer
                            color = if (showFilter) Colors.White.unsafeCast<Color>() else Colors.Slate900.unsafeCast<Color>()
                        }
                        onClick = { showFilter = !showFilter }
                        +"⚙️"
                    }
                    
                    // Notifications
                    button {
                        css {
                            background = "transparent"
                            border = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
                            borderRadius = 12.px
                            padding = 0.75.rem
                            cursor = Cursor.pointer
                            position = Position.relative
                        }
                        
                        +"🔔"
                        
                        // Badge
                        span {
                            css {
                                position = Position.absolute
                                top = (-4).px
                                right = (-4).px
                                backgroundColor = Colors.RedBet.unsafeCast<Color>()
                                color = Colors.White.unsafeCast<Color>()
                                borderRadius = 50.pct
                                width = 20.px
                                height = 20.px
                                fontSize = 0.75.rem
                                display = Display.flex
                                alignItems = AlignItems.center
                                justifyContent = JustifyContent.center
                            }
                            +"3"
                        }
                    }
                }
            }
            
            // Search Panel
            if (showSearch) {
                div {
                    css {
                        marginBottom = 1.rem
                    }
                    
                    input {
                        css {
                            width = 100.pct
                            padding = 0.75.rem
                            border = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
                            borderRadius = 12.px
                            fontSize = 1.rem
                        }
                        
                        placeholder = "Search agreements..."
                        value = searchQuery
                        onChange = { event ->
                            searchQuery = event.target.value
                        }
                    }
                }
            }
            
            // Filter Panel
            if (showFilter) {
                div {
                    css {
                        display = Display.flex
                        gap = 0.5.rem
                        flexWrap = FlexWrap.wrap
                    }
                    
                    filters.forEach { filter ->
                        button {
                            css {
                                background = if (selectedFilter == filter) Colors.TealGradient else "transparent"
                                color = if (selectedFilter == filter) Colors.White.unsafeCast<Color>() else Colors.Slate900.unsafeCast<Color>()
                                border = Border(1.px, LineStyle.solid, Colors.Slate200.unsafeCast<Color>())
                                borderRadius = 20.px
                                padding = Padding(0.5.rem, 1.rem)
                                cursor = Cursor.pointer
                                fontSize = 0.875.rem
                                display = Display.flex
                                alignItems = AlignItems.center
                                gap = 0.25.rem
                            }
                            
                            onClick = { selectedFilter = filter }
                            
                            +filter
                            
                            span {
                                css {
                                    backgroundColor = if (selectedFilter == filter) 
                                        "rgba(255,255,255,0.2)".unsafeCast<Color>() 
                                    else Colors.Slate200.unsafeCast<Color>()
                                    borderRadius = 50.pct
                                    padding = Padding(0.125.rem, 0.375.rem)
                                    fontSize = 0.75.rem
                                    minWidth = 20.px
                                    textAlign = TextAlign.center
                                }
                                +"${filterCounts[filter] ?: 0}"
                            }
                        }
                    }
                }
            }
        }
        
        // Stats Cards
        div {
            css {
                padding = 1.rem
                display = Display.grid
                gridTemplateColumns = repeat(2, 1.fr)
                gap = 1.rem
                marginBottom = 1.rem
            }
            
            // Active Agreements
            StatsCard {
                title = "Active"
                value = "5"
                gradient = Colors.TealGradient
            }
            
            // Total Agreements  
            StatsCard {
                title = "Total"
                value = "23"
                gradient = Colors.OrangeGradient
            }
            
            // Star Rating
            StatsCard {
                title = "Rating"
                value = "4.9"
                gradient = "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)"
            }
            
            // On-time Rate
            StatsCard {
                title = "On-time"
                value = "96%"
                gradient = "linear-gradient(135deg, #10B981 0%, #059669 100%)"
            }
        }
        
        // Quick Action Button
        div {
            css {
                padding = Padding(0.px, 1.rem, 1.rem, 1.rem)
            }
            
            button {
                css {
                    width = 100.pct
                    background = Colors.TealGradient
                    color = Colors.White.unsafeCast<Color>()
                    border = None.none
                    borderRadius = 16.px
                    padding = 1.rem
                    fontSize = 1.125.rem
                    fontWeight = FontWeight.semiBold
                    cursor = Cursor.pointer
                    display = Display.flex
                    alignItems = AlignItems.center
                    justifyContent = JustifyContent.center
                    gap = 0.5.rem
                }
                
                +"+ Create New Agreement"
            }
        }
        
        // Agreement List
        div {
            css {
                padding = Padding(0.px, 1.rem, 1.rem, 1.rem)
            }
            
            h2 {
                css {
                    fontSize = 1.25.rem
                    fontWeight = FontWeight.semiBold
                    color = Colors.Slate900.unsafeCast<Color>()
                    marginBottom = 1.rem
                }
                +"Recent Agreements"
            }
            
            // Sample agreements
            AgreementCard {
                type = "Personal Loan"
                icon = "💰"
                counterparty = "Nasserddine Ouladsalah"
                rating = 5.0
                status = "Active"
                amount = "£110"
                progress = 0.0
                dueDate = "15 Mar 2026"
                statusColor = Colors.TealPrimary
            }
            
            AgreementCard {
                type = "Bet/Wager"
                icon = "🎲"
                counterparty = "Sarah Johnson"
                rating = 4.8
                status = "Pending Blind Sign"
                amount = "£50"
                progress = 0.0
                dueDate = "Match Day"
                statusColor = Colors.AmberAccent
            }
        }
        
        // Bottom Navigation
        BottomNavigation {}
    }
}