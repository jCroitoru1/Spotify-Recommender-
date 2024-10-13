import requests
import base64
import pandas as pd

client_id = 'insert_yours_here'
client_secret = 'insert_yours_here'

# Function to get Spotify token
def get_spotify_token(client_id, client_secret):
    url = 'https://accounts.spotify.com/api/token'
    headers = {
        'Authorization': 'Basic ' + base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode('utf-8'),
    }
    data = {
        'grant_type': 'client_credentials'
    }
    response = requests.post(url, headers=headers, data=data)
    token_info = response.json()
    return token_info['access_token']

# Function to retrieve up to 1 million artists by genre with pagination
def search_artists_by_genre(genre, token, total_artists=1000000, limit=25):
    url = 'https://api.spotify.com/v1/search'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    all_artists = []
    offset = 0
    
    while len(all_artists) < total_artists:
        params = {
            'q': f'genre:"{genre}"',
            'type': 'artist',
            'limit': limit,
            'offset': offset
        }
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            artists_data = response.json()
            artists = artists_data.get('artists', {}).get('items', [])
            
            if not artists:  # No more artists to fetch
                break
            
            for artist in artists:
                artist_name = artist['name']
                artist_genres = artist.get('genres', [])
                artist_popularity = artist.get('popularity', None)
                all_artists.append({
                    'name': artist_name,
                    'genres': artist_genres,
                    'popularity': artist_popularity
                })
            
            offset += limit  # Increment the offset to get the next batch of artists
            
            # Stop if we have reached the total desired number of artists
            if len(all_artists) >= total_artists:
                break
            
        else:
            print(f"Error: {response.status_code}, {response.json()}")
            break

    return all_artists

# Function to store artists data into a dataframe with dynamic naming
def store_artists_to_dataframe(genre, artists_data):
    # Create a dataframe for the genre with the collected data
    df = pd.DataFrame(artists_data)
    # Dynamically name the dataframe variable based on the genre
    globals()[f"{genre}_df"] = df
    return df

# Application of the functions
if __name__ == "__main__":
    genres = ["house"]  # Specify your list of genres
    token = get_spotify_token(client_id, client_secret)

    for genre in genres:
        # Fetch up to 1 million artists for each genre
        print(f"Fetching artists for genre: {genre}")
        artists_data = search_artists_by_genre(genre, token)
        
        # Store the artist data in a dataframe named after the genre
        genre_df = store_artists_to_dataframe(genre, artists_data)
        
        # Optionally, save the dataframe to a CSV file
        filename = f"{genre}_artists_data.csv"
        genre_df.to_csv(filename, index=False)
        print(f"Data for genre '{genre}' saved to {filename}")
