Project 4: Archery Club Capstone
Emily MacPherson <macphere@oregonstate.edu>

|               |                     |
| ------------- | ------------------- |
| Field         | Value               |
| Author        | Emily MacPherson    |
| Date          | 2026-10-25          |
| Status        | Proposed            |
| Decision Date | (fill when decided) |
| Deciders      | George and Emily    |
| Superseded By | n/a                 |

## Problem and Context

We must decide the database schema for our Archery Club scoring web app. This decision is critical because it defines the structure and relationships of different entities stored within our app. These entities include scorecards, ends, tournaments, members, pin awards, league competitions, and league teams. We must decide the relationships between these entities (one to one, many to one, one to many, or many-to-many), and correctly structure any junction tables for the many-to-many relationships. We must ensure to cover all edge cases when thinking about these relationships. For example, it may seem on the surface that the "member" and "award pin" relationship is one to one (since a member can only be on one award pin "level" at a time, similar to the belts in karate). But in reality, if a member shoots two kinds of bows, they can be on a different award pin level for each bow category, so it is actually a one to many relationship. We must also define the fields within each table, include correct foreign keys, and decide on the most logical data types for all fields. For example, should target size in cm be a "tinyint" datatype (only one byte), or is it feasible for the club to shoot at targets that are more than 256cm in diameter?

What makes this decision so important to get right is that it would be difficult to change in the future once real data is added. Even seemingly minor changes to the schema could have unexpected consequences that may cause downtime, errors, or unnecessarily increase the complexity of our code. For example, if we decided to retroactively add an extra field to the scorecard, we would either have to go back and add that field to every past scorecard, or add code to check if that field doesn't actually exist in every place where we try to access that field. The former may involve having to invent and handle dummy data (since that field wasn't recorded at the time and no one remembers), and the latter involves adding code that may seem confusing or pointless to future developers, and opens up more opportunities for edge-case errors.

One of the biggest decisions with the database schema is how to handle the relationship between the different events and scorecards. The OSU Archery Club hosts and attends multiple different kinds of events, some of which use very different methods for scoring. These events can (for the most part) be split into two different categories: league competitions and tournaments. League competitions span an entire term and are based on cumulative scores shot at weekly practices, and also involve teams. On the other hand, tournaments happen in a much shorter time period (usually only 1 day, or maybe 2 days), and they are always individually scored. Therefore, the tournament table and the league competition table must be separate (rather than just one "event" table), because their required fields are quite different. However, both of these events use the same kinds of scorecards. The decision is how to handle the relationships between the scorecards and events.

## Options

### Option A: Separate scorecard tables for each type of event 

Option A is to have two scorecard tables, `tournament_scorecard` and `league_comp_scorecard`. `Tournament_scorecard` would have a foreign key for a tournament, and `league_comp_scorecard` would have a foreign key for a league competition. Other than that, both scorecard tables would have the exact same fields. This is likely the "cleanest" and simplest way to go about things, since it would mean all scorecards have only one possible table as their parent. However, it also means that there is a lot of redundancy. It creates two different tables that have, essentially, the exact same fields. This splits scorecards into two different buckets that really should all be treated as the same entity, because they are. Pulling from these two buckets may also cause extra confusion/complexity when trying to aggregate scorecard data. 

However, a benefit of this option is more maintainable, since if a new category of event is added, ex "free-style shoot", then all we need to do is add a new scorecard table, rather than add a new field to the existing scorecard table. It would increase the redundancy, but be much easier to implement than having to add null fields to past data.

### Option B: Use one scorecard table with multiple nullable parent foreign keys 


In Option B, we create only one scorecard table with multiple nullable parent foreign keys, enforcing in our code that only ONE field can be non-null for all scorecards. This option may be less clean/standard, but it the benefits are that it reduces redundancy and complexity. All scorecards exist within the same bucket, and their parent is simply which ever foreign key field is not null. From my Archery Club experience, it is unlikely that the number of possible parents will ever exceed more than a handful, and unlikely that it even exceeds 3. However, the costs are that adding a new event may be tedious, as all past scorecards would have to be changed to add a null field for that parent foreign key, or there would need to be a code added that ensured there was not a failure if this field does not exist. 

### Option C: event shared parent table

In Option C, we create a shared parent table, `event`, that holds the identity of every event the club runs. `tournament` and `league_comp` become subtypes of it: each one’s primary key is also a foreign key to `event.id`, and each keeps its own unique fields. There is only one scorecard table, and it has a single, non-null foreign key to event.

The benefits of this option are that every scorecard would have only one possible type of foreign key, but we would still be able to have just one scorecard table. This would reduce redundancy while keeping the scorecard table clean. It would also improve maintainability, since adding a new event would only require adding new a new table and new entry to `events`, rather than modifying past data or changing old code. 

The costs is that it adds to the complexity of the schema, which may not be worth it if we only ever have 2 or 3 different kinds of events (which is pretty likely).

### Option D: Do Nothing

I'm not sure exactly how to interpret "do nothing" in the context of my decision. If that means not having a database schema at all, then that would be a bad option for a lot of reasons. Database schemas define how different pieces of data are related to each other in a very structured and objective way. Without this structure, its basically impossible to use the data in a meaningful way. For example, if we do not track which scorecards are related to which users or which event, then the scorecards become meaningless. We also need a relational database

## Analysis

The technical trade offs here are mainly those related to maintainability and complexity. For option A, lack of redundancy is sacrificed for maintainability, and in option B, vice versa. In option C, maintainbility and redundancy are both preserved, but complexity is increased. 

## Recommendation and Verification Plan

I personally propose Option C, since I think that it is the cleanest and most maintainable solution. However, I will need some help building the schema for this, as shared parent tables are a complexity that I'm not familiar with when it comes to relational databases. 
The acceptance criteria is that we can add scorecards to the database without errors, and that we can easily add a new event to the database without downtime or errors. This will be checked whenever we add new data or a new event.
## Constraints

The only constraint here regarding data use is that we do not want to store sensitive information about our members in our database. We will only be storing the first and last name of our members who consent to have their name added. We will allow users to choose the public username that their scorecard data and leaderboard status shows up as. Other than this, there is no licensing, IP, and the partner confidentiality boundary constraints, as our project is intended to be open source and use only free tools (except for hosting). 

## Delegation and Validation

- What you handed to AI tools  
    I consulted AI tools for advice on whether it is good practice or not to have nullable parent foreign key fields. My prompt was "In relational databases, is it bad practice to have a table that has two possible foreign keys. So like one is always null and the other is not null?" Additionally, I gave the AI the context of the decision I needed to make, and asked for help on what a shared-parent table would look like for this specific situation.
    
- What checks made that reasonable:
	- There are currently no tests in our repo to check if the database schema is feasible. I'm honestly not sure how you would check that.
- Where you stopped and validated the result yourself, and why those points.
	- The checking I have done is looking at past club events and written scorecards, and looking at the data that needs to be stored
    

What is assessed is in the [AI policy](https://capstone.alexulbrich.com/assignments/introduction/#ai-policy-applies-to-every-assignment).

## Decision

Proposed, until your team decides. Then accepted, rejected, or superseded, with the date and who chaired the decision. If superseded, link the RFC that replaces this one.