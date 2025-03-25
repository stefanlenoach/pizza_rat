import requests
import json
import time

def fetch_pizza_places(neighborhood, borough, api_key):
    """Fetch pizza places for a specific neighborhood"""
    url = "https://places.googleapis.com/v1/places:searchText"
    all_places = []
    
    # We'll need to use a pageToken for pagination
    page_token = None
    page_count = 0
    max_pages = 10  # Limit to 3 pages per neighborhood to avoid excessive requests
    
    while page_count < max_pages:
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.location,places.rating,places.userRatingCount,places.types,nextPageToken"
        }
        
        # Create request data - specify the neighborhood and borough for precision
        data = {
            "textQuery": f"pizza restaurants in {neighborhood}, {borough}, New York City",
            "maxResultCount": 20  # Maximum allowed per request
        }
        
        # Add page token if we have one from a previous request
        if page_token:
            data["pageToken"] = page_token
        
        # Make the request
        try:
            response = requests.post(url, json=data, headers=headers)
            result = response.json()
            
            # Check if we got results
            if "places" in result:
                # Add neighborhood and borough information to each place
                for place in result["places"]:
                    place["neighborhood"] = neighborhood
                    place["borough"] = borough
                
                # Add to our collection
                all_places.extend(result["places"])
                print(f"Found {len(result['places'])} places in {neighborhood}, {borough} (page {page_count+1})")
                
                # Check if there are more pages
                if "nextPageToken" in result:
                    page_token = result["nextPageToken"]
                    page_count += 1
                    # Wait a bit to avoid rate limiting
                    time.sleep(2)
                else:
                    break
            else:
                print(f"No results for {neighborhood}, {borough} or error in response")
                if "error" in result:
                    print(f"Error: {result['error']}")
                break
                
        except Exception as e:
            print(f"Error fetching data for {neighborhood}: {str(e)}")
            break
    
    return all_places

# Comprehensive list of Brooklyn neighborhoods
brooklyn_neighborhoods = [
    "Greenpoint",
    "Williamsburg",
    "Bushwick",
    "Bedford-Stuyvesant",
    "Clinton Hill",
    "Fort Greene",
    "Brooklyn Heights",
    "DUMBO",
    "Downtown Brooklyn",
    "Boerum Hill",
    "Cobble Hill",
    "Carroll Gardens",
    "Red Hook",
    "Gowanus",
    "Park Slope",
    "Prospect Heights",
    "Crown Heights",
    "Prospect Lefferts Gardens",
    "Flatbush",
    "East Flatbush",
    "Midwood",
    "Sheepshead Bay",
    "Manhattan Beach",
    "Brighton Beach",
    "Coney Island",
    "Bensonhurst",
    "Bay Ridge",
    "Sunset Park",
    "Borough Park",
    "Kensington",
    "Windsor Terrace",
    "Ditmas Park",
    "Flatlands",
    "Canarsie",
    "East New York",
    "Brownsville",
    "Cypress Hills",
    "Marine Park",
    "Mill Basin",
    "Bergen Beach",
    "Brooklyn Navy Yard"
]

api_key = "AIzaSyABZPisEjlYgkA7l3PyvC8NPlaFJVTV-bk"
all_pizza_places = []
unique_place_ids = set()  # To track unique places

for neighborhood in brooklyn_neighborhoods:
    print(f"\nFetching pizza places in {neighborhood}, Brooklyn...")
    neighborhood_places = fetch_pizza_places(neighborhood, "Brooklyn", api_key)
    
    # Add only unique places to our collection
    for place in neighborhood_places:
        if "id" in place and place["id"] not in unique_place_ids:
            unique_place_ids.add(place["id"])
            all_pizza_places.append(place)
    
    print(f"Total unique places found so far: {len(all_pizza_places)}")
    time.sleep(3)  # Wait between neighborhoods to avoid rate limiting

# Create a final data structure with metadata
brooklyn_pizza_data = {
    "metadata": {
        "total_places": len(all_pizza_places),
        "borough": "Brooklyn",
        "neighborhoods": brooklyn_neighborhoods,
        "date_collected": time.strftime("%Y-%m-%d"),
        "source": "Google Places API"
    },
    "places": all_pizza_places
}

# Save to file
with open('brooklyn_pizza_places.json', 'w') as f:
    json.dump(brooklyn_pizza_data, f, indent=2)

print(f"\nSuccessfully collected {len(all_pizza_places)} unique pizza places across Brooklyn")
print(f"Data saved to brooklyn_pizza_places.json")

# Generate a simple neighborhood summary
neighborhood_counts = {}
for place in all_pizza_places:
    neighborhood = place["neighborhood"]
    if neighborhood not in neighborhood_counts:
        neighborhood_counts[neighborhood] = 0
    neighborhood_counts[neighborhood] += 1

print("\nPizza places by neighborhood:")
for neighborhood, count in sorted(neighborhood_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"{neighborhood}: {count} places")