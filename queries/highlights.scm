(const_literal) @number

(type_declaration) @type

(function_declaration
    (identifier) @function)

(type_constructor_or_function_call_expression
    (type_declaration) @function)

["fn"] @keyword

[
    (true)
    (false)
] @constant.builtin

;; punctuation
[ "," "." ":" ";" ] @punctuation.delimeter

;; brackets
[
    "("
    ")"
    "["
    "]"
    "{"
    "}"
] @punctuation.bracket

[
    "loop"
    "for"
    "break"
    "continue"
    "continuing"
] @repeat

[
    "if"
    "else"
    "elseif"
    "switch"
    "case"
    "default"
] @conditional

[
    "||"
    "&&"
    "|"
    "^"
    "&"
    "=="
    "!="
] @operator

(ERROR) @error