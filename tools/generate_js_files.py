#!/usr/bin/env python3
# By: David Choo
# Generate a Javascript file, bird-sounds-metadata.js, with 2 objects with all the information from cleaned.csv
# Global JS variables:
#   birdSoundsByFileId["123"] = {
#       englishName: "...",
#       vocalizationType: "...",
#       quality: "...",
#       time: "...",
#       year: "2020",
#       x: "123",
#       y: "123"
#   }
#   birdSoundsDrillDown[englishName][vocalizationType] = ["123", "124"]
import collections
import csv
import json
import re

with open("cleaned.csv") as data_file:
    # Output JSON structures
    by_file_id = {}
    # drill_down[english_name][vocalization_type] = ["file_id1", ...]
    drill_down = collections.defaultdict(lambda: collections.defaultdict(list))

    csv_reader = csv.reader(data_file, dialect="excel")
    next(csv_reader) # skip header
    for row in csv_reader:
        file_id, english_name, vocalization_type, quality, time, date, x, y = row

        year = "unknown"
        match = re.search(r"(\d{4})", date)
        if match:
            year = int(match.group(0))
            if year == 0:
                year = "unknown"

        by_file_id[file_id] = {
            "englishName": english_name,
            "vocalizationType": vocalization_type,
            "quality": quality,
            "time": time,
            "year": year,
            "x": x,
            "y": y
        }
        drill_down[english_name][vocalization_type].append(file_id)

    with open("bird-sounds-metadata.js", "w") as output_file:
        output_file.write("let birdSoundsByFileId = ")
        json.dump(by_file_id, output_file)
        output_file.write("\n")
        output_file.write("let birdSoundsDrillDown = ")
        json.dump(drill_down, output_file)
        output_file.write("\n")

