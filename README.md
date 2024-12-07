# Avery
work in progress discord/revolt bot

planned features:

## Custom Discord/Revolt Bridge
- support account linking
    - i originally imagined this would just be useful for moderators so the callmod command could work cross-platform, but this would definitely be useful for users as well. nicknames, roles, xp, economy stuff, etc.
- support for shared server emoji
    - in other words, if someone uses a custom emote, it should automatically be translated when the message is copied to the opposing platform.
- support for deleting messages across both platforms (up to 24hrs old)
- support for reactions
    - current idea is that reactions added to a message on one platform will simply be added by the bot on the opposite platform, and users can use a command to check how many reactions have been added to the message and by whom. kinda janky, but it'll technically work.
- support for pinned messages
    - needs more discussion.
    - new message pin notifications can be sent cross-platform easily, but actually pinning messages cross-platform would be incredibly difficult. revolt does not have pinned messages (at least not user-facing), and being able to get the same messages across platforms to be able to pin them beyond a certain period is impossible.
- support for message replies (up to 24hrs old)
- message buffering (save and resend messages when one platform/server is temporarily unavailable)
- mirror announcement channel feeds and webhooks
- unfortunately, threads and forum channels are pretty much completely out of the question since revolt has nothing like them at all

## Moderation
- all standard moderation actions, like ban/kick/mute
- call mod command (aka "modping" from old projects)
    - should also include a "vacation mode" and a dummy `@moderator` role as an alternate ping method
- note command to simply add a note for a particular user
- audit logs and moderation records

## XP and Economy
- grant a certain amount of xp per message
    - maximum of 25 levels, but we could also have "prestige" roles if needed
    - algorithm provided by amy: `math.floor((1+math.sqrt(1+8*xp/50))/2)-1` [(source)](https://discord.com/channels/803584639541313577/1182191622222516244/1220142236906291220)
    - could probably be scaled based on message length to encourage more thoughtful discussions?
- in addition to xp, users are also granted virtual money.
    - this is deposited into user accounts every 2(?) weeks much like a real biweekly paycheck. i wanna do this mainly to discourage spam, but i also dont wanna make people feel like they're missing out on something if they don't check in every once in a while. need more feedback on this idea.
    - money can be used to buy various items from a virtual shop, few current ideas include:
        - send a message in the announcements channel
            - should be the most expensive item on the list
            - `@everyone` pings allowed
            - messages must be approved first
        - temporary new server rule
            - new server-wide rule for 1 week
            - all submitted rules have to go through an approval process before being officially enforced.
            - users cannot be banned or kicked for violating these rules, but they *can* be muted. custom punishments can be defined as well.
        - temporary server icon
            - changes the server icon to whatever image you send for 1 week.
            - images must be approved first, otherwise the purchase is refunded in full.
        - shut up
            - instantly mutes someone for the next 1 hour.
            - essential PvP item
        - sponsor a channel
            - adds a user's name to a channel description for 1 month
        - really, really good health insurance
            - game item: russian roulette
            - allows user to retain half of the money they would've lost
            - consumed with each play, regardless of win or loss.
        - 

## Mini-Games
- ties in with economy system
    - most games will reward players with cash
    - players can also buy items from the shop to boost their abilities in certain games
- most games use a party system, which involves creating a new text channel (mainly for revolt support)
- game ideas include:
    - russian roulette
        - simplest game of chance which promises to double all the money you've accumulated up to that point, but with a 1/6 chance of completely emptying your bank account.
        - can only be played once per 12 hours
        - 1-3 players
    - blackjack
        - based on the real life casino game
        - has a bet limit (needs to be sorted out after initial income design is finalized)
        - can only be played 4 times per 12 hours.
        - players will also be temporarily banned from this game if they win too much money within a certain period.
        - much like the real game, the house always wins, but there's potential for get-rich quick schemes. internally, this uses 4 full decks of cards, which can theoretically allow for card counting as a fun easter egg for those in the know.
        - 1-4 players
    - texas hold 'em poker
        - based on the real life casino game
        - requires DM permissions
        - has a bet limit (needs to be sorted out after initial income design is finalized)
        - can only be played 4 times per 12 hours.
        - players will also be temporarily banned from this game if they win too much money within a certain period.
        - 2-6 players
    - some kind of roguelike dungeon crawler RPG
        - todo, need more thoughts on this
        - rewards players with increasing amounts of money for each floor cleared
        - 1-4 players
    - connect 4
        - self-explanatory
        - rewards players with a small amount of money for winning
        - 2 players
    - chess
        - self-explanatory
        - rewards players with a small amount of money for winning
        - 2 players
    - checkers
        - self-explanatory
        - rewards players with a small amount of money for winning
        - 2 players

## Miscellaneous
- reaction roles (and role command for the odd occasion where these dont work)
- in-channel notifications for name/description changes
- starboard-like pinning feature
- remindme command