module.exports =

    arrayEqual: (arr1, arr2) ->
        JSON.stringify(arr1) is JSON.stringify(arr2)

    capitalize: (string) ->
        return (string.split(' ').map (word) -> word[0].toUpperCase() + word[1..-1].toLowerCase()).join ' '

    slugify: (str) ->
        str = str.replace ' ', '_'

        return str.toLowerCase()

    unSlugify: (str) ->
        if '_' in str
            str = str.replace('_', ' ')

        return @capitalize str
