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
             "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.regularOpeningHours,places.location,places.rating,places.userRatingCount,places.types,nextPageToken"
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

# Comprehensive list of neighborhoods by borough
neighborhoods = {
    "Brooklyn": [
        "Greenpoint", "Williamsburg", "Bushwick", "Bedford-Stuyvesant", "Clinton Hill",
        "Fort Greene", "Brooklyn Heights", "DUMBO", "Downtown Brooklyn", "Boerum Hill",
        "Cobble Hill", "Carroll Gardens", "Red Hook", "Gowanus", "Park Slope",
        "Prospect Heights", "Crown Heights", "Prospect Lefferts Gardens", "Flatbush",
        "East Flatbush", "Midwood", "Sheepshead Bay", "Manhattan Beach", "Brighton Beach",
        "Coney Island", "Bensonhurst", "Bay Ridge", "Sunset Park", "Borough Park",
        "Kensington", "Windsor Terrace", "Ditmas Park", "Flatlands", "Canarsie",
        "East New York", "Brownsville", "Cypress Hills", "Marine Park", "Mill Basin",
        "Bergen Beach", "Brooklyn Navy Yard"
    ],
    "Manhattan": [
        "Financial District", "Tribeca", "Chinatown", "Lower East Side", "East Village",
        "Greenwich Village", "West Village", "Chelsea", "Flatiron District", "Gramercy",
        "Murray Hill", "Midtown East", "Midtown West", "Upper East Side", "Upper West Side",
        "Morningside Heights", "Harlem", "East Harlem", "Washington Heights", "Inwood"
    ],
    "Queens": [
        "Astoria", "Long Island City", "Sunnyside", "Woodside", "Jackson Heights",
        "Elmhurst", "Corona", "Forest Hills", "Rego Park", "Kew Gardens",
        "Richmond Hill", "Jamaica", "Flushing", "Whitestone", "Bayside",
        "Little Neck", "Douglaston", "Fresh Meadows", "Howard Beach", "Ozone Park",
        "South Ozone Park", "Rockaway Beach", "Far Rockaway"
    ],
    "Bronx": [
        "Mott Haven", "Port Morris", "Melrose", "Hunts Point", "Longwood",
        "Morrisania", "Claremont", "Crotona Park", "Tremont", "Belmont",
        "Fordham", "University Heights", "Morris Heights", "Highbridge",
        "Concourse", "Mount Eden", "Mount Hope", "Kingsbridge", "Riverdale",
        "Pelham Bay", "Throgs Neck", "Country Club", "City Island"
    ],
    "Staten Island": [
        "St. George", "Tompkinsville", "Stapleton", "Clifton", "New Brighton",
        "West Brighton", "Port Richmond", "Mariners Harbor", "Graniteville",
        "Bulls Head", "New Springville", "Travis", "New Dorp", "Oakwood",
        "Great Kills", "Eltingville", "Annadale", "Huguenot", "Tottenville"
    ]
}

api_key = "AIzaSyABZPisEjlYgkA7l3PyvC8NPlaFJVTV-bk"
all_pizza_places = []
unique_place_ids = set()  # To track unique places

# Process each borough and its neighborhoods
for borough, borough_neighborhoods in neighborhoods.items():
    print(f"\nProcessing {borough}...")
    borough_places = []
    
    for neighborhood in borough_neighborhoods:
        print(f"\nFetching pizza places in {neighborhood}, {borough}...")
        neighborhood_places = fetch_pizza_places(neighborhood, borough, api_key)
        # Add only unique places to our collection
        for place in neighborhood_places:
            if "id" in place and place["id"] not in unique_place_ids:
                unique_place_ids.add(place["id"])
                all_pizza_places.append(place)
                borough_places.append(place)
        print(f"Total unique places found so far: {len(all_pizza_places)}")
        time.sleep(3)  # Wait between neighborhoods to avoid rate limiting
    
    # Save borough-specific data
    borough_data = {
        "metadata": {
            "total_places": len(borough_places),
            "borough": borough,
            "neighborhoods": borough_neighborhoods,
            "date_collected": time.strftime("%Y-%m-%d"),
            "source": "Google Places API"
        },
        "places": borough_places
    }
    
    # Save borough data to file
    filename = f"{borough.lower().replace(' ', '_')}_pizza_places.json"
    with open(filename, 'w') as f:
        json.dump(borough_data, f, indent=2)
    print(f"\nSaved {len(borough_places)} places to {filename}")

# Save complete NYC data
nyc_pizza_data = {
    "metadata": {
        "total_places": len(all_pizza_places),
        "boroughs": list(neighborhoods.keys()),
        "date_collected": time.strftime("%Y-%m-%d"),
        "source": "Google Places API"
    },
    "places": all_pizza_places
}

# Save to file
with open('nyc_pizza_places.json', 'w') as f:
    json.dump(nyc_pizza_data, f, indent=2)

print(f"\nSuccessfully collected {len(all_pizza_places)} unique pizza places across NYC")
print(f"Data saved to nyc_pizza_places.json")

# Generate borough and neighborhood summaries
borough_counts = {}
neighborhood_counts = {}

for place in all_pizza_places:
    # Borough summary
    borough = place["borough"]
    if borough not in borough_counts:
        borough_counts[borough] = 0
    borough_counts[borough] += 1
    
    # Neighborhood summary
    neighborhood = place["neighborhood"]
    if neighborhood not in neighborhood_counts:
        neighborhood_counts[neighborhood] = 0
    neighborhood_counts[neighborhood] += 1

print("\nPizza places by borough:")
for borough, count in sorted(borough_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"{borough}: {count} places")

print("\nTop 20 neighborhoods by number of pizza places:")
top_neighborhoods = sorted(neighborhood_counts.items(), key=lambda x: x[1], reverse=True)[:20]
for neighborhood, count in top_neighborhoods:
    print(f"{neighborhood}: {count} places")