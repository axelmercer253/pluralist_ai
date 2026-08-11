# pluralist_ai
Pluralist ai news app



sample codeiiiiiootiiiiioot
write a node js stateless application ( use nodejs auth token) titled pluralist ai which has postgresql database and has three types of users....one is reader second admin third is the publisher ....the front end will use basic html plain js and css ...the reader will sign up or sign in then read articles from first page or reader home page ( theres non signed in home page too) ...the articles will be pulled from the database and the readers will vote on the issues which are attached on the articles....the first page of the reader and publisher will have a chat interface on the footer.....use sticky css for the footer ai chat ui.....use form security for the html element don't use js framework just plain js with css....the admin will moderate the articles and the issues attached to the articles .....each articles will have a three issues and the  readers can vote yes or no to the issue ..... the admin will have to publish the articles on the dashboard.... When the dashboard  load for the admin account the dashboard will pull  the news from google rss url below.... Each fetched news will be input in an ai api which is open router base url stated below.... this is the ai input that  needs to be passed 'what are six main issues of the article news below that concerns various society groups like, education, health sector, business, transport group, feminists, cultural party, ethnic groups, media, democrats.  ( Article_text )'...the  6 issue that will be the output from the ai open router result is moderated or approved by the admin they have to choose 3 issues  they want publish along with the article if the admin accepted ( use checkbox on HTML) the 3 issues the published button will be enabled...then this news will be printed on the readers account ( once the reader click the article..also this can be voted on ).... The admin also has a page for moderating or approving the video or audio uploaded or articles submitted by the publishers... The audio and video has its own table( same table for this which will have the url for accessing the media) and the articles from the publishers will be on another db table....on the readers account the reader may use ai chat to query the pluralist ai...the open router ai will be instructed to answer only those related to politics and social issues no general knowledge questions allowed there... The publisher account will have a sign up and sign in url on the footer of the 1st page or non user web page of the pluralist ai dot com...the publisher will have a dashboard with upload form for video or audio there will be a drop down for categorizing if the media uploaded is in an audio or video use html form security for this ....the publisher will have a link or button to write an article for the pluralist ai website this article will be moderated or approved by the admin account....comment out each steps of this prompt in your code so i can explain this to fresh grad web developer also ... use api limiter for ai chat queries with 30 api calls per minute ...also use js fetch like on form submits and redirects for page transition or page links....open router api keys in the .env file and sample.env too


Open router api key 1 - use only for ai chat ui

Open router api key 2 - use for news issues

Open router api key 3 - use for news issues 

Open router api

Neon db url 
postgresql://neondb_owner:npg_NBAmgudI4Ph6@ep-mute-unit-azir3enq.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode= require

Database name
Neondb

News google rss
https://news.google.com/rss/search?q=balita&hl=fil-PH&gl=PH&ceid=PH:fil

Simple js code for google rss
const Parser = require("rss-parser");

const parser = new Parser();

async function getNews(query, country = "US", language = "en-US") {

    const countryLanguage = `${country}:${language.split("-")[0]}`;

        const url =
                `https://news.google.com/rss/search?` +
                        `q=${encodeURIComponent(query)}` +
                                `&hl=${encodeURIComponent(language)}` +
                                        `&gl=${encodeURIComponent(country)}` +
                                                `&ceid=${encodeURIComponent(countryLanguage)}`;

                                                    const feed = await parser.parseURL(url);

                                                        return feed.items.map(article => ({
                                                                title: article.title,
                                                                        link: article.link,
                                                                                published: article.pubDate,
                                                                                        source: article.creator || null,
                                                                                                description: article.contentSnippet || null
                                                                                                    }));
                                                                                                    }


                                                                                                    // Example
                                                                                                    getNews("artificial intelligence")
                                                                                                        .then(news => {
                                                                                                                console.log(JSON.stringify(news, null, 2));
                                                                                                                    })
                                                                                                                        .catch(console.error);


                                                                                                                        /////####################


                                                                                                                        // Neon db sample code 


                                                                                                                        // db.js file

                                                                                                                        const sql = require("./db");

                                                                                                                        async function testDatabase() {
                                                                                                                            try {
                                                                                                                                    const result = await sql`SELECT NOW() AS time`;

                                                                                                                                            console.log("Database connected!");
                                                                                                                                                    console.log("Server time:", result[0].time);

                                                                                                                                                        } catch (error) {
                                                                                                                                                                console.error("Database connection failed:");
                                                                                                                                                                        console.error(error);
                                                                                                                                                                            }
                                                                                                                                                                            }

                                                                                                                                                                            testDatabase();


