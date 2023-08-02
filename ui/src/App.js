import React, { useState, useRef } from "react";
import "./App.css";
import Autosuggest from "react-autosuggest";

function App() {
  const [value, setValue] = useState("");
  const [suggestedValues, setSuggestedValues] = useState([]);
  const debounceTimeout = useRef(null);

  const getSuggestions = (inputValue) => {
    return fetch(`http://localhost:3000/suggestions?query=${inputValue}`)
      .then((response) => response.json())
      .then((data) => data || [])
      .catch((error) => {
        console.error("Error fetching suggestions:", error);
        return [];
      });
  };

  const onSuggestionsFetchRequested = ({ value }) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Add a 500ms debounce before making the API call
    debounceTimeout.current = setTimeout(() => {
      getSuggestions(value)
        .then((result) => {
          setSuggestedValues(result);
        })
        .catch((error) => {
          console.error("Error fetching suggestions:", error);
          setSuggestedValues([]);
        });
    }, 500);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestedValues([]);
  };

  const onChange = (event, { newValue }) => {
    setValue(newValue);
  };

  const getSuggestionValue = (suggestion) => suggestion;

  const renderSuggestion = (suggestion) => {
    if (!suggestion) {
      return <div>No product found</div>;
    }

    const productName = suggestion["Product Name"];
    const maxWords = 6;
    const words = productName.split(" ");
    const truncatedProductName =
      words.length > maxWords
        ? `${words.slice(0, maxWords).join(" ")}...`
        : productName;

    return (
      <div className="suggestion-container">
        <div className="suggestion-image">
          <img src={suggestion?.Image} alt={suggestion["Product Name"]} />
        </div>
        <div className="suggestion-details">
          <div className="suggestion-field suggestion-title">
            {truncatedProductName}
          </div>
          <div className="suggestion-field">
            <span className="suggestion-price">
              {suggestion["Selling Price"]}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const inputProps = {
    placeholder: "Search",
    value,
    onChange,
  };

  return (
    <div className="App">
      <Autosuggest
        suggestions={suggestedValues}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    </div>
  );
}

export default App;
